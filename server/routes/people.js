const express = require('express');
const {
  getPeople,
  getPerson,
  createPerson,
  updatePerson,
  deletePerson
} = require('../controllers/people');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, getPeople)
  .post(protect, createPerson);

router.route('/:id')
  .get(protect, getPerson)
  .put(protect, updatePerson)
  .delete(protect, deletePerson);

module.exports = router;