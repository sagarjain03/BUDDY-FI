const express = require('express');
const { block, listBlocks, unblock } = require('../controllers/safetyController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();
router.use(protect);

router.post('/', block);
router.get('/', listBlocks);
router.delete('/:userId', unblock);

module.exports = router;
