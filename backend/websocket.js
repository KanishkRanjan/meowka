const Vehicle = require('./models/vehicleModel');
const TrackPoint = require('./models/trackPointModel');

async function processTelemetryData(vehicleId, data) {
  try {
    const { latitude, longitude, speed, fuelLeft, timestamp } = data;
    let vehicle = await Vehicle.findOne({ vehicle_id: vehicleId });

    if (!vehicle) {
      console.log(`[WS] Vehicle ${vehicleId} not found. Creating a new one.`);
      vehicle = await Vehicle.create({
        vehicle_id: vehicleId,
        name: `Simulated Vehicle ${vehicleId}`,
        type: 'Truck',
        number_plate: `SIM-${vehicleId}`,
        fuel: 100,
        owner: {
          name: 'Delhi OTD',
          contact: 'API',
          email: 'admin@transit.gov'
        },
        last_service_date: new Date(),
        next_service_due: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        location_coordinates: { latitude, longitude },
        speed: speed,
        max_speed: speed,
        distance: 0,
        total_distance: 0,
        today_running: 0,
        status: 'Idle'
      });
    }

    const prevCoords = vehicle.location_coordinates || { latitude: 0, longitude: 0 };
    const newCoords = { latitude, longitude };

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
    
    // Only calculate distance if prevCoords were actually set (not 0,0 default)
    let distanceMoved = 0;
    if (prevCoords.latitude !== 0 && prevCoords.longitude !== 0) {
        distanceMoved = +(R * c).toFixed(5);
    }

    // Calculate realistic speed if GTFS failed to provide it but the bus moved
    const TIME_INTERVAL_HOURS = 10 / 3600; // approximately 10s polling
    let calculatedSpeed = speed;
    if (speed === 0 && distanceMoved > 0.0001) {
        calculatedSpeed = distanceMoved / TIME_INTERVAL_HOURS;
    }

    // Update vehicle fields
    vehicle.location_coordinates = newCoords;
    vehicle.speed = calculatedSpeed;
    vehicle.distance = (vehicle.distance || 0) + distanceMoved;
    vehicle.total_distance = (vehicle.total_distance || 0) + distanceMoved;

    // Update max_speed
    if (calculatedSpeed > (vehicle.max_speed || 0)) {
      vehicle.max_speed = calculatedSpeed;
    }

    // Update today's running
    const currentDate = new Date(timestamp || new Date()).toISOString().split('T')[0];
    const todayDate = new Date().toISOString().split('T')[0];
    if (currentDate === todayDate) {
      vehicle.today_running = (vehicle.today_running || 0) + distanceMoved;
    }

    // Update status based on realistic speed
    vehicle.status = calculatedSpeed > 0.5 ? (calculatedSpeed < 10 ? 'Slow Moving' : 'Moving') : 'Idle';

    // Update fuel efficiency
    if (vehicle.last_fuel_left != null && distanceMoved > 0) {
      const fuelUsed = vehicle.last_fuel_left - fuelLeft;
      if (fuelUsed > 0) {
        vehicle.avg_fuel_efficiency = distanceMoved / fuelUsed;
      }
    }
    vehicle.last_fuel_left = fuelLeft;

    // Save vehicle
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

    console.log(`[WS] Processed telemetry for ${vehicleId}`);
  } catch (err) {
    console.error(`WebSocket Telemetry Error: ${err.message}`);
  }
}

module.exports = function configureWebSocket(server) {
  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        // Expecting data: { vehicle_id: 'VH001', latitude: x, longitude: y, speed: s, fuelLeft: f, timestamp: t }
        if (data.vehicle_id) {
            await processTelemetryData(data.vehicle_id, data);
        } else {
            console.error('WebSocket received message without vehicle_id:', data);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
};
