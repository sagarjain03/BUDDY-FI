const express = require('express');
const { listReports, updateReport } = require('../controllers/safetyController');
const { protect } = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/requireVerified');

const router = express.Router();

router.use(protect);
router.use(requireAdmin);

router.get('/reports', listReports);
router.patch('/reports/:id', updateReport);

module.exports = router;
