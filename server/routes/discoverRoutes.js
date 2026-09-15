const express = require('express');
const { listMatches, getMatch } = require('../controllers/discoverController');
const { protect } = require('../middlewares/authMiddleware');
const { requireVerified } = require('../middlewares/requireVerified');

const router = express.Router();

router.use(protect);
router.use(requireVerified);

router.get('/', listMatches);
router.get('/:id', getMatch);

module.exports = router;
