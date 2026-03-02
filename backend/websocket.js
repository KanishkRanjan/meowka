const Vehicle = require('./models/vehicleModel');
const TrackPoint = require('./models/trackPointModel');

async function processTelemetryData(vehicleId, data) {
  try {
    const { latitude, longitude, speed, fuelLeft, timestamp, heading: incomingHeading } = data;
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
        status: 'Idle',
        heading: incomingHeading !== undefined ? incomingHeading : 0
      });
    }

    const prevCoords = vehicle.location_coordinates || { latitude: 0, longitude: 0 };
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
    
    // Only calculate distance if prevCoords were actually set (not 0,0 default)
    let distanceMoved = 0;
    if (prevCoords.latitude !== 0 && prevCoords.longitude !== 0) {
        const d = R * c;
        // Sanity Check: If distance > 1km in a single update (~10s), it's likely a GPS jump/glitch
        // A bus moving at 120km/h only covers ~0.33km in 10s.
        if (d < 1.0) {
            distanceMoved = +d.toFixed(5);
        } else {
            console.warn(`[WS] Ignored large coordinate jump (${d.toFixed(2)}km) for vehicle ${vehicleId}`);
        }
    }

    // Calculate realistic speed if GTFS failed to provide it but the bus moved
    const TIME_INTERVAL_HOURS = 10 / 3600; // approximately 10s polling
    let calculatedSpeed = speed;
    
    // Convert m/s to km/h if it looks like raw GTFS data (meters/second usually < 50)
    // Most vehicles don't go > 180 km/h. If we get something like 20, it might be m/s (72 km/h).
    // However, the seeder should handle this. Here we just ensure sanity.
    if (speed === 0 && distanceMoved > 0.0001) {
        calculatedSpeed = distanceMoved / TIME_INTERVAL_HOURS;
    }

    // Absolute Sanity Cap: 120 km/h for public transport
    if (calculatedSpeed > 120) {
        console.warn(`[WS] Capping unrealistic speed (${calculatedSpeed.toFixed(2)} km/h) for vehicle ${vehicleId}`);
        calculatedSpeed = 120;
    }

    // Update vehicle fields
    vehicle.location_coordinates = newCoords;
    vehicle.speed = calculatedSpeed;
    if (distanceMoved > 0) {
        // Only update heading if the vehicle actually moved
        vehicle.heading = calculateHeading(prevCoords.latitude, prevCoords.longitude, newCoords.latitude, newCoords.longitude);
    } else if (incomingHeading !== undefined) {
        // If it didn't move but the seeder gave us an explicit heading (e.g. GTFS bearing or random initial)
        vehicle.heading = incomingHeading;
    }
    
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
