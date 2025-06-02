const express = require('express');
const {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember
} = require('../controllers/teams');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, getTeams)
  .post(protect, authorize('admin'), createTeam);

router.route('/:id')
  .get(protect, getTeam)
  .put(protect, authorize('admin'), updateTeam)
  .delete(protect, authorize('admin'), deleteTeam);

router.route('/:id/members')
  .post(protect, authorize('admin'), addMember)
  .delete(protect, authorize('admin'), removeMember);

module.exports = router;