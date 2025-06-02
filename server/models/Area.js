const mongoose = require('mongoose');

const AreaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  boundaries: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: {
      type: [[[Number]]],  // GeoJSON format for polygons
      default: undefined
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create geospatial index for efficient queries
AreaSchema.index({ boundaries: '2dsphere' });

module.exports = mongoose.model('Area', AreaSchema);