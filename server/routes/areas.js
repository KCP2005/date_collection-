const express = require('express');
const {
  getAreas,
  getArea,
  createArea,
  updateArea,
  deleteArea
} = require('../controllers/areas');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, getAreas)
  .post(protect, authorize('admin'), createArea);

router.route('/:id')
  .get(protect, getArea)
  .put(protect, authorize('admin'), updateArea)
  .delete(protect, authorize('admin'), deleteArea);

module.exports = router;