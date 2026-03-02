const express = require('express');
const router = express.Router();
const Vehicle = require('../models/vehicleModel');
const TrackPoint = require('../models/trackPointModel');

// POST /api/vehicles/addvehicle
router.post('/addvehicle', async (req, res) => {
  try {
    const {
      vehicle_id,
      name,
      type,
      number_plate,
      fuel,
      owner,
      last_service_date,
      next_service_due,
      location_coordinates,
      speed , 
      max_speed , 
      distance , 
      total_distance , 
      today_running , 
      status 
    } = req.body;

    const existingVehicle = await Vehicle.findOne({ number_plate });
    if (existingVehicle) {
      return res.status(400).json({ success: false, message: 'Vehicle already exists' });
    }

    const vehicle = await Vehicle.create({
      vehicle_id,
      name,
      type,
      number_plate,
      fuel,
      owner,
      last_service_date,
      next_service_due,
      location_coordinates,
      speed,
      max_speed,
      distance,
      total_distance,
      today_running,
      status,
      heading: 0
    });

    res.status(201).json({ success: true, data: vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/vehicles/addinfo/:id
router.post('/addinfo/:id', async (req, res) => {
  try {
    const vehicleId = req.params.id;
    const { latitude, longitude, speed, fuelLeft, timestamp } = req.body;

    const vehicle = await Vehicle.findOne({ vehicle_id: vehicleId });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const prevCoords = vehicle.location_coordinates;
    const newCoords = { latitude, longitude };

    // Function to calculate heading based on two lat/lng points
    const calculateHeading = (lat1, lon1, lat2, lon2) => {
      if (lat1 === lat2 && lon1 === lon2) return 0;
      
      const radLat1 = lat1 * Math.PI / 180;
      const radLat2 = lat2 * Math.PI / 180;
      const deltaLon = (lon2 - lon1) * Math.PI / 180;

      const y = Math.sin(deltaLon) * Math.cos(radLat2);
      const x = Math.cos(radLat1) * Math.sin(radLat2) -
                Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(deltaLon);
      
      let heading = Math.atan2(y, x) * 180 / Math.PI;
      heading = (heading + 360) % 360;
      return heading;
    };

    // Distance Calculation using Haversine Formula
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    const dLat = toRad(newCoords.latitude - prevCoords.latitude);
    const dLon = toRad(newCoords.longitude - prevCoords.longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(prevCoords.latitude)) *
        Math.cos(toRad(newCoords.latitude)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    let distanceMoved = 0;
    const d = R * c;
    // Sanity Check: If distance > 1km in a single update, it's likely a GPS jump
    if (d < 1.0) {
        distanceMoved = +d.toFixed(5);
    } else {
        console.warn(`[API] Ignored large coordinate jump (${d.toFixed(2)}km) for vehicle ${vehicleId}`);
    }

    // Update vehicle fields
    vehicle.location_coordinates = newCoords;
    
    // Sanity Cap: 120 km/h
    let safeSpeed = speed;
    if (speed > 120) {
        console.warn(`[API] Capping unrealistic speed (${speed} km/h) for vehicle ${vehicleId}`);
        safeSpeed = 120;
    }
    
    vehicle.speed = safeSpeed;
    if (distanceMoved > 0 && prevCoords.latitude && prevCoords.longitude) {
         vehicle.heading = calculateHeading(prevCoords.latitude, prevCoords.longitude, newCoords.latitude, newCoords.longitude);
    }
    vehicle.distance += distanceMoved;
    vehicle.total_distance += distanceMoved;

    // Update max_speed
    if (safeSpeed > vehicle.max_speed) {
      vehicle.max_speed = safeSpeed;
    }

    // Update today's running if date matches
    const currentDate = new Date(timestamp || new Date()).toISOString().split('T')[0];
    const todayDate = new Date().toISOString().split('T')[0];
    if (currentDate === todayDate) {
      vehicle.today_running += distanceMoved;
    }

    // Update status
    vehicle.status = safeSpeed > 0 ? (safeSpeed < 5 ? 'Slow Moving' : 'Moving') : 'Idle';

    // Optional: Update fuel efficiency
    if (vehicle.last_fuel_left != null && distanceMoved > 0) {
      const fuelUsed = vehicle.last_fuel_left - fuelLeft;
      if (fuelUsed > 0) {
        vehicle.avg_fuel_efficiency = distanceMoved / fuelUsed;
      }
    }
    vehicle.last_fuel_left = fuelLeft;

    // Optional: Check if service is due soon (within 7 days)
    const today = new Date();
    const nextServiceDate = new Date(vehicle.next_service_due);
    vehicle.service_due_soon = (nextServiceDate - today) / (1000 * 60 * 60 * 24) <= 7;

    await vehicle.save();

    // Save new tracking point
    await TrackPoint.create({
      vehicleId: vehicle.vehicle_id,
      latitude,
      longitude,
      speed,
      fuelLeft,
      timestamp: timestamp || new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: vehicle
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/vehicles/getall
router.get('/getall', async (req, res) => {
  try {
    const vehicles = await Vehicle.find().limit(req.query.limit || 10);

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// GET /api/vehicles/getinfo/:id
router.get('/getinfo/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ vehicle_id: req.params.id });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// GET /api/vehicles/trackdata/:id?date=YYYY-MM-DD&startTime=HH:MM&endTime=HH:MM
router.get('/trackdata/:id', async (req, res) => {
  try {
    const vehicleId = req.params.id;
    const inputDate = req.query.date || new Date().toISOString().split('T')[0]; // default to today

    const startTime = req.query.startTime || '00:00';
    const endTime = req.query.endTime || '23:59';

    const [year, month, day] = inputDate.split('-').map(Number);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    // Build in UTC
    const startDateTime = new Date(Date.UTC(year, month - 1, day, startHour, startMinute, 0, 0));
    const endDateTime = new Date(Date.UTC(year, month - 1, day, endHour, endMinute, 59, 999));
    
    console.log('Start:', startDateTime.toISOString().replace('Z', '+00:00'));
    console.log('End:', endDateTime.toISOString().replace('Z', '+00:00'));

    // Use start and end times to bound the query
    const trackData = await TrackPoint.find({
      vehicleId,
      timestamp: {
        $gte: new Date(startDateTime.toISOString()),
        $lte: new Date(endDateTime.toISOString())
      }
    }).sort({ timestamp: 1 }); // Sort chronologically

    res.status(200).json({ 
      success: true, 
      count: trackData.length,
      data: trackData 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



module.exports = router;


