const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const Connection = require('../models/connectionModel');
const Conversation = require('../models/conversationModel');
const Message = require('../models/messageModel');
const Notification = require('../models/notificationModel');
const Block = require('../models/blockModel');
const Session = require('../models/sessionModel');
const Report = require('../models/reportModel');
const { getQuestions } = require('../services/questionService');
const { deleteImage } = require('../utils/imageStore');
const { hasPoint } = require('../utils/geo');

const fail = (res, err, label) => {
  console.error(`${label} failed:`, err);
  res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again.' });
};

/**
 * GET /api/auth/me/export
 *
 * Everything we hold about the caller, as JSON. Other people's messages are
 * included only where they are part of a conversation the caller was in — that
 * is their own correspondence, not a window into someone else's account.
 */
exports.exportMe = async (req, res) => {
  try {
    const userId = req.user._id;

    const [questions, connections, conversations, notifications, blocks, sessions] =
      await Promise.all([
        getQuestions(),
        Connection.find({ $or: [{ requester: userId }, { recipient: userId }] })
          .populate('requester recipient', 'name')
          .lean(),
        Conversation.find({ participants: userId }).populate('participants', 'name').lean(),
        Notification.find({ user: userId }).populate('actor', 'name').lean(),
        Block.find({ blocker: userId }).populate('blocked', 'name').lean(),
        Session.find({ user: userId }).lean(),
      ]);

    const messages = await Message.find({
      conversation: { $in: conversations.map((conversation) => conversation._id) },
    })
      .populate('sender', 'name')
      .lean();

    const byId = new Map(questions.map((question) => [String(question._id), question]));

    res.status(200).json({
      exportedAt: new Date().toISOString(),
      account: {
        name: req.user.name,
        email: req.user.email,
        age: req.user.age,
        gender: req.user.gender,
        bio: req.user.bio,
        interests: req.user.interests,
        avatarUrl: req.user.avatar?.url,
        isVerified: req.user.isVerified,
        createdAt: req.user.createdAt,
      },
      preferences: {
        shareLocation: req.user.shareLocation !== false,
        sharePresence: req.user.sharePresence !== false,
        weeklyEmail: req.user.emailPrefs?.digest !== false,
      },
      location: hasPoint(req.user.location)
        ? {
            longitude: req.user.location.coordinates[0],
            latitude: req.user.location.coordinates[1],
            updatedAt: req.user.location.updatedAt,
          }
        : null,
      quizAnswers: (req.user.answers || []).map((answer) => {
        const question = byId.get(String(answer.question));
        return {
          question: question?.prompt || 'Unknown question',
          answer:
            question?.options.find((option) => option.value === answer.value)?.label ||
            answer.value,
          answeredAt: answer.answeredAt,
        };
      }),
      connections: connections.map((connection) => ({
        with:
          String(connection.requester?._id) === String(userId)
            ? connection.recipient?.name
            : connection.requester?.name,
        status: connection.status,
        youAsked: String(connection.requester?._id) === String(userId),
        createdAt: connection.createdAt,
      })),
      conversations: conversations.map((conversation) => ({
        with: conversation.participants
          .filter((participant) => String(participant._id) !== String(userId))
          .map((participant) => participant.name),
        messages: messages
          .filter((message) => String(message.conversation) === String(conversation._id))
          .map((message) => ({
            from: message.sender?.name,
            body: message.body,
            sentAt: message.createdAt,
          })),
      })),
      notifications: notifications.map((notification) => ({
        type: notification.type,
        from: notification.actor?.name,
        at: notification.createdAt,
      })),
      blocked: blocks.map((block) => ({ name: block.blocked?.name, at: block.createdAt })),
      sessions: sessions.map((session) => ({
        device: session.userAgent,
        lastSeenAt: session.lastSeenAt,
        createdAt: session.createdAt,
      })),
    });
  } catch (err) {
    fail(res, err, 'exportMe');
  }
};

/**
 * DELETE /api/auth/me  { password }
 *
 * Removes the account and everything attached to it. Requires the password,
 * because an account deletion triggered by a stolen token would be unrecoverable.
 */
exports.deleteMe = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Confirm your password to delete your account' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ status: 'error', message: 'That password is not right' });
    }

    const userId = user._id;
    const conversations = await Conversation.find({ participants: userId }).select('_id');
    const conversationIds = conversations.map((conversation) => conversation._id);

    await Promise.all([
      Message.deleteMany({ conversation: { $in: conversationIds } }),
      Conversation.deleteMany({ _id: { $in: conversationIds } }),
      Connection.deleteMany({ $or: [{ requester: userId }, { recipient: userId }] }),
      Notification.deleteMany({ $or: [{ user: userId }, { actor: userId }] }),
      Block.deleteMany({ $or: [{ blocker: userId }, { blocked: userId }] }),
      Session.deleteMany({ user: userId }),
      // Reports they filed are kept, anonymised: moderation history should not
      // be erasable by the person who caused it.
      Report.updateMany({ reporter: userId }, { $unset: { reporter: 1 } }),
      Report.updateMany({ reported: userId }, { $unset: { reported: 1 } }),
    ]);

    if (user.avatar?.publicId) await deleteImage(user.avatar.publicId).catch(() => {});
    await User.deleteOne({ _id: userId });

    res.status(200).json({ status: 'success', message: 'Your account has been deleted.' });
  } catch (err) {
    fail(res, err, 'deleteMe');
  }
};
