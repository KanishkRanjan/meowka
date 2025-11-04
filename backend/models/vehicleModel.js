const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  vehicle_id: {
    type: String,
    unique: true,
  },
  name: String,
  type: String,
  number_plate: { type: String, unique: true },
  fuel: String,
  owner: {
    name: String,
    contact: String,
    email: String,
  },
  last_service_date: Date,
  next_service_due: Date,
  location_coordinates: {
    latitude: Number,
    longitude: Number,
  },
  speed: {
    type: Number,
    default: 0,
  },
  max_speed: {
    type: Number,
    default: 120,
    distance: {
      type: Number,
      default: 0,
    },
    total_distance: {
      type: Number,
      default: 0,
    },
    today_running: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Moving", "Parked", "Idle"], 
      default: "Idle", 
    },
  },
});

module.exports = mongoose.model("Vehicle", vehicleSchema);
