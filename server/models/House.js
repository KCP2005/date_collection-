const mongoose = require('mongoose');

const HouseSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    trim: true
  },
  area: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],  // [longitude, latitude]
      required: true
    }
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  submissionDate: {
    type: Date,
    default: Date.now
  }
});

// Create geospatial index for efficient queries
HouseSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('House', HouseSchema);