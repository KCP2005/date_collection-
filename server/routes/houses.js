const express = require('express');
const {
  getHouses,
  getHouse,
  createHouse,
  updateHouse,
  deleteHouse
} = require('../controllers/houses');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, getHouses)
  .post(protect, createHouse);

router.route('/:id')
  .get(protect, getHouse)
  .put(protect, updateHouse)
  .delete(protect, deleteHouse);

module.exports = router;