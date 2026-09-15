const mongoose = require('mongoose');
const Conversation = require('../models/conversationModel');
const Message = require('../models/messageModel');
const { isBlockedBetween } = require('../utils/blocks');
const {
  findOrCreateConversation,
  listConversations,
  markRead,
  serialiseConversation,
  totalUnread,
  MessageError,
} = require('../services/messageService');

const PAGE_SIZE = 30;

const fail = (res, err, label) => {
  if (err instanceof MessageError) {
    return res.status(err.status).json({ status: 'error', message: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(404).json({ status: 'error', message: 'Conversation not found' });
  }
  console.error(`${label} failed:`, err);
  return res
    .status(500)
    .json({ status: 'error', message: 'Something went wrong. Please try again.' });
};

/** GET /api/conversations */
exports.list = async (req, res) => {
  try {
    const conversations = await listConversations(req.user._id);
    res.status(200).json({
      status: 'success',
      results: conversations.length,
      data: { conversations },
    });
  } catch (err) {
    fail(res, err, 'list conversations');
  }
};

/** GET /api/conversations/unread-count — for the navbar badge. */
exports.unreadCount = async (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      data: { unread: await totalUnread(req.user._id) },
    });
  } catch (err) {
    fail(res, err, 'unread count');
  }
};

/** POST /api/conversations  { userId } — find or create, requires a connection. */
exports.open = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ status: 'error', message: 'A valid userId is required' });
    }

    const conversation = await findOrCreateConversation(req.user._id, userId);
    await conversation.populate('participants', 'name age gender');
    await conversation.populate('lastMessage', 'body sender createdAt');

    res.status(200).json({
      status: 'success',
      data: { conversation: serialiseConversation(conversation, req.user._id) },
    });
  } catch (err) {
    fail(res, err, 'open conversation');
  }
};

/**
 * GET /api/conversations/:id/messages?before=<iso>
 * Newest first, 30 at a time. `before` is a createdAt cursor.
 */
exports.messages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ status: 'error', message: 'Conversation not found' });
    }
    if (!conversation.isParticipant(req.user._id)) {
      return res.status(403).json({ status: 'error', message: 'That is not your conversation' });
    }

    // A block hides the conversation from the list; it must also close the
    // history, which is otherwise still reachable by id.
    const other = conversation.otherParticipant(req.user._id);
    if (other && (await isBlockedBetween(req.user._id, other))) {
      return res.status(404).json({ status: 'error', message: 'Conversation not found' });
    }

    const query = { conversation: conversation._id };
    if (req.query.before) {
      const before = new Date(req.query.before);
      if (!Number.isNaN(before.valueOf())) query.createdAt = { $lt: before };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(PAGE_SIZE + 1)
      .populate('sender', 'name');

    const hasMore = messages.length > PAGE_SIZE;
    const page = hasMore ? messages.slice(0, PAGE_SIZE) : messages;

    res.status(200).json({
      status: 'success',
      results: page.length,
      hasMore,
      // Oldest first, ready to render top to bottom.
      data: { messages: page.reverse() },
    });
  } catch (err) {
    fail(res, err, 'list messages');
  }
};

/** PATCH /api/conversations/:id/read */
exports.read = async (req, res) => {
  try {
    const conversation = await markRead(req.params.id, req.user._id);
    await conversation.populate('participants', 'name age gender');
    await conversation.populate('lastMessage', 'body sender createdAt');

    res.status(200).json({
      status: 'success',
      data: { conversation: serialiseConversation(conversation, req.user._id) },
    });
  } catch (err) {
    fail(res, err, 'mark read');
  }
};
