const express = require('express');
const {
  list,
  open,
  messages,
  read,
  unreadCount,
} = require('../controllers/conversationController');
const { protect } = require('../middlewares/authMiddleware');
const { requireVerified } = require('../middlewares/requireVerified');

const router = express.Router();

router.use(protect);
router.use(requireVerified);

router.get('/', list);
router.post('/', open);
router.get('/unread-count', unreadCount);
router.get('/:id/messages', messages);
router.patch('/:id/read', read);

module.exports = router;
