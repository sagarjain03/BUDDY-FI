const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Conversation = require('../models/conversationModel');
const {
  sendMessage,
  markRead,
  serialiseConversation,
  MessageError,
} = require('../services/messageService');
const notifyService = require('../services/notifyService');
const presence = require('../services/presenceService');

// Simple per-socket throttle so one client cannot flood a room.
const RATE_LIMIT = { messages: 20, windowMs: 10_000 };

let ioRef = null;

/** Emits to every socket belonging to one user, across tabs and devices. */
function emitToUser(userId, event, payload) {
  ioRef?.to(`user:${userId}`).emit(event, payload);
}

function attach(io) {
  ioRef = io;

  // Injected rather than required, to avoid a cycle: the services push through
  // the socket, and the socket calls the services.
  notifyService.setEmitter(emitToUser);
  presence.setEmitter(emitToUser);

  // A crash leaves everyone marked online forever; clear it on boot.
  presence.resetAll().catch((err) => console.error('presence reset failed:', err.message));

  // Handshake auth. Without this any stranger could open a socket.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('unauthorized'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name');
      if (!user) return next(new Error('unauthorized'));

      socket.userId = String(user._id);
      socket.userName = user.name;
      return next();
    } catch {
      return next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    // One room per user so the server can push without knowing which
    // conversation they happen to have open.
    socket.join(`user:${socket.userId}`);

    presence.addSocket(socket.userId, socket.id);
    presence.connected(socket.userId).catch(() => {});

    socket.on('disconnect', () => {
      presence.disconnected(socket.userId, socket.id).catch(() => {});
    });

    let sentInWindow = 0;
    let windowStart = Date.now();

    const overRateLimit = () => {
      const now = Date.now();
      if (now - windowStart > RATE_LIMIT.windowMs) {
        windowStart = now;
        sentInWindow = 0;
      }
      sentInWindow += 1;
      return sentInWindow > RATE_LIMIT.messages;
    };

    socket.on('message:send', async ({ conversationId, body } = {}, ack) => {
      try {
        if (overRateLimit()) {
          throw new MessageError('You are sending messages too quickly', 429);
        }

        // The sender is the authenticated socket, never anything the client sent.
        const { message, conversation } = await sendMessage({
          conversationId,
          senderId: socket.userId,
          body,
        });

        const payload = {
          _id: message._id,
          conversation: message.conversation,
          body: message.body,
          sender: {
            _id: message.sender._id,
            name: message.sender.name,
          },
          createdAt: message.createdAt,
        };

        await conversation.populate('participants', 'name age gender');
        await conversation.populate('lastMessage', 'body sender createdAt');

        for (const participant of conversation.participants) {
          const id = String(participant._id);
          emitToUser(id, 'message:new', payload);
          emitToUser(id, 'conversation:updated', serialiseConversation(conversation, id));

          if (id !== String(socket.userId)) {
            // Collapsed per conversation inside notify().
            notifyService
              .notify({
                user: id,
                type: 'new_message',
                actor: socket.userId,
                entity: { kind: 'conversation', id: conversation._id },
              })
              .catch(() => {});
          }
        }

        ack?.({ ok: true, message: payload });
      } catch (err) {
        const status = err instanceof MessageError ? err.status : 500;
        if (status === 500) console.error('socket message:send failed:', err);
        ack?.({
          ok: false,
          error: status === 500 ? 'Could not send that message' : err.message,
        });
      }
    });

    socket.on('message:read', async ({ conversationId } = {}) => {
      try {
        const conversation = await markRead(conversationId, socket.userId);
        await conversation.populate('participants', 'name age gender');
        await conversation.populate('lastMessage', 'body sender createdAt');

        emitToUser(
          socket.userId,
          'conversation:updated',
          serialiseConversation(conversation, socket.userId)
        );
      } catch {
        /* reading is best effort; a failure here must not break the socket */
      }
    });

    socket.on('typing:start', async ({ conversationId } = {}) => {
      const other = await otherParticipantOf(conversationId, socket.userId);
      if (other) {
        emitToUser(other, 'typing:start', { conversationId, userId: socket.userId });
      }
    });

    socket.on('typing:stop', async ({ conversationId } = {}) => {
      const other = await otherParticipantOf(conversationId, socket.userId);
      if (other) {
        emitToUser(other, 'typing:stop', { conversationId, userId: socket.userId });
      }
    });
  });
}

/** Resolves the other participant, and returns null if the caller is not in it. */
async function otherParticipantOf(conversationId, userId) {
  if (!conversationId) return null;
  try {
    const conversation = await Conversation.findById(conversationId).select('participants');
    if (!conversation || !conversation.isParticipant(userId)) return null;
    const other = conversation.otherParticipant(userId);
    return other ? String(other) : null;
  } catch {
    return null;
  }
}

module.exports = { attach, emitToUser };
