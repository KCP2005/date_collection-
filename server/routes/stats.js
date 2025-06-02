const express = require('express');
const {
  getSummary,
  getStatsByTeam,
  getStatsByArea,
  getStatsByTime
} = require('../controllers/stats');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected with authentication
router.get('/summary', protect, getSummary);
router.get('/by-team', protect, getStatsByTeam);
router.get('/by-area', protect, getStatsByArea);
router.get('/by-time', protect, getStatsByTime);

module.exports = router;