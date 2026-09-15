const express = require('express');
const {
  send,
  listAccepted,
  listIncoming,
  listOutgoing,
  accept,
  decline,
  remove,
  counts,
} = require('../controllers/connectionController');
const { protect } = require('../middlewares/authMiddleware');
const { requireVerified } = require('../middlewares/requireVerified');

const router = express.Router();

router.use(protect);
router.use(requireVerified);

router.post('/', send);
router.get('/', listAccepted);
router.get('/counts', counts);
router.get('/pending', listIncoming);
router.get('/sent', listOutgoing);
router.patch('/:id/accept', accept);
router.patch('/:id/decline', decline);
router.delete('/:id', remove);

module.exports = router;
