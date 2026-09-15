const express = require('express');
const { list } = require('../controllers/questionController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/', list);

module.exports = router;
