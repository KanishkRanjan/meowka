const mongoose = require('mongoose');

const trackPointSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      required: true,
      index: true
    },
    latitude: Number,
    longitude: Number,
    speed: Number,
    fuelLeft: Number,
    timestamp: {
      type: Date,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('TrackPoint', trackPointSchema);