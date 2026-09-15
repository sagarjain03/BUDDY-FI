const Conversation = require('../models/conversationModel');
const Message = require('../models/messageModel');
const { MAX_BODY } = require('../models/messageModel');
const { areConnected } = require('../utils/connections');
const { isBlockedBetween, blockedIdsFor } = require('../utils/blocks');

const PUBLIC_USER_FIELDS = 'name age gender avatar isOnline lastSeenAt sharePresence';

class MessageError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Finds the conversation between two users, or creates it.
 * Requires an accepted connection — this is the gate that stops cold messaging.
 */
async function findOrCreateConversation(userId, otherId) {
  if (String(userId) === String(otherId)) {
    throw new MessageError('You cannot message yourself', 400);
  }

  if (await isBlockedBetween(userId, otherId)) {
    throw new MessageError('You cannot message this person', 403);
  }

  if (!(await areConnected(userId, otherId))) {
    throw new MessageError('You can only message people you are connected with', 403);
  }

  const existing = await Conversation.findOne({
    participants: { $all: [userId, otherId], $size: 2 },
  });
  if (existing) return existing;

  return Conversation.create({ participants: [userId, otherId], unread: {} });
}

/**
 * Persists a message and returns it populated, plus the conversation.
 *
 * The write happens before anything is broadcast, so a failed save never
 * reaches another client.
 */
async function sendMessage({ conversationId, senderId, body }) {
  const text = typeof body === 'string' ? body.trim() : '';
  if (!text) {
    throw new MessageError('A message cannot be empty', 400);
  }
  // Checked here as well as on the schema, so the caller gets a useful reason
  // instead of a generic write failure.
  if (text.length > MAX_BODY) {
    throw new MessageError(`A message cannot be longer than ${MAX_BODY} characters`, 400);
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new MessageError('Conversation not found', 404);
  }
  if (!conversation.isParticipant(senderId)) {
    throw new MessageError('That is not your conversation', 403);
  }

  const other = conversation.otherParticipant(senderId);
  // Re-checked on every message: blocking or removing a connection must stop
  // the chat immediately, not at the next page load.
  if (other && (await isBlockedBetween(senderId, other))) {
    throw new MessageError('You cannot message this person', 403);
  }
  if (other && !(await areConnected(senderId, other))) {
    throw new MessageError('You are no longer connected with this person', 403);
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: senderId,
    body: text,
    readBy: [senderId],
  });

  conversation.lastMessage = message._id;
  conversation.lastMessageAt = message.createdAt;
  for (const participant of conversation.participants) {
    if (String(participant) === String(senderId)) {
      conversation.unread.set(String(participant), 0);
    } else {
      conversation.unread.set(
        String(participant),
        (conversation.unread.get(String(participant)) || 0) + 1
      );
    }
  }
  await conversation.save();

  await message.populate('sender', PUBLIC_USER_FIELDS);

  return { message, conversation };
}

/** Marks everything in a conversation read for one participant. */
async function markRead(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new MessageError('Conversation not found', 404);
  }
  if (!conversation.isParticipant(userId)) {
    throw new MessageError('That is not your conversation', 403);
  }

  const other = conversation.otherParticipant(userId);
  if (other && (await isBlockedBetween(userId, other))) {
    throw new MessageError('Conversation not found', 404);
  }

  await Message.updateMany(
    { conversation: conversation._id, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } }
  );

  conversation.unread.set(String(userId), 0);
  await conversation.save();

  return conversation;
}

/** Shape one conversation for the list, from `userId`'s point of view. */
function serialiseConversation(conversation, userId) {
  const other = conversation.participants.find(
    (participant) => String(participant._id || participant) !== String(userId)
  );

  return {
    _id: conversation._id,
    withUser: other?._id
      ? {
          _id: other._id,
          name: other.name,
          age: other.age,
          gender: other.gender,
          avatar: other.avatar,
          ...(other.sharePresence === false
            ? {}
            : { isOnline: Boolean(other.isOnline), lastSeenAt: other.lastSeenAt }),
        }
      : null,
    lastMessage: conversation.lastMessage
      ? {
          body: conversation.lastMessage.body,
          sender: conversation.lastMessage.sender,
          createdAt: conversation.lastMessage.createdAt,
        }
      : null,
    lastMessageAt: conversation.lastMessageAt,
    unread: conversation.unread?.get?.(String(userId)) || 0,
  };
}

async function listConversations(userId) {
  const blocked = await blockedIdsFor(userId);

  const conversations = await Conversation.find({
    participants: { $all: [userId], $nin: blocked },
  })
    .sort({ lastMessageAt: -1, createdAt: -1 })
    .populate('participants', PUBLIC_USER_FIELDS)
    .populate('lastMessage', 'body sender createdAt');

  return conversations.map((conversation) => serialiseConversation(conversation, userId));
}

/** Total unread across every conversation, for the navbar badge. */
async function totalUnread(userId) {
  const blocked = await blockedIdsFor(userId);
  const conversations = await Conversation.find({
    participants: { $all: [userId], $nin: blocked },
  }).select('unread');
  return conversations.reduce(
    (sum, conversation) => sum + (conversation.unread?.get?.(String(userId)) || 0),
    0
  );
}

module.exports = {
  MessageError,
  findOrCreateConversation,
  sendMessage,
  markRead,
  listConversations,
  serialiseConversation,
  totalUnread,
  PUBLIC_USER_FIELDS,
};
