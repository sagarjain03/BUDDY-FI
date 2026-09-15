const express = require('express');
const { report } = require('../controllers/safetyController');
const { protect } = require('../middlewares/authMiddleware');
const { reportLimiter } = require('../middlewares/rateLimit');

const router = express.Router();
router.use(protect);

router.post('/', reportLimiter, report);

module.exports = router;
