const express = require('express');
const { list, unreadCount, readAll, readOne } = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/', list);
router.get('/unread-count', unreadCount);
router.patch('/read', readAll);
router.patch('/:id/read', readOne);

module.exports = router;
