import asyncio
import json
import random
import math
from datetime import datetime
import websockets

# Configuration
URI = os.getenv("WS_URI", "ws://localhost:3000")
NUM_VEHICLES = 10
VEHICLE_PREFIX = "VH"

# Coordinates from your first set (main route)
ROUTE_1 = [
    [73.86193, 18.51463], [73.86181, 18.51295], [73.86316, 18.5129], 
    [73.86434, 18.51239], [73.8658, 18.51182], [73.86763, 18.51103], 
    [73.86827, 18.51077], [73.86852, 18.51125], [73.86642, 18.5122], 
    [73.86662, 18.51263], [73.86729, 18.51273], [73.86782, 18.513], 
    [73.86871, 18.51304], [73.86867, 18.51424], [73.86858, 18.51558], 
    [73.86861, 18.51662], [73.86783, 18.51672], [73.86721, 18.51676], 
    [73.86601, 18.5167], [73.86603, 18.5154], [73.86543, 18.5154], 
    [73.86429, 18.51576], [73.86374, 18.51616], [73.86249, 18.51606], 
    [73.86179, 18.51602], [73.86057, 18.5159], [73.85943, 18.516], 
    [73.85941, 18.51488], [73.85949, 18.51419], [73.85956, 18.51333], 
    [73.85975, 18.51262], [73.86031, 18.51122], [73.86031, 18.51034], 
    [73.86043, 18.51002], [73.86105, 18.51014], [73.86216, 18.51008], 
    [73.86317, 18.51004]
]

# Coordinates from your second set (alternate route)
ROUTE_2 = [
    [73.86186, 18.51311], [73.86307, 18.5129], [73.86461, 18.51225], 
    [73.86616, 18.51168], [73.86779, 18.51103], [73.86826, 18.51054], 
    [73.86688, 18.51034], [73.86543, 18.51059], [73.86388, 18.51067], 
    [73.86242, 18.5105], [73.86208, 18.51042], [73.86211, 18.50834], 
    [73.86241, 18.50647], [73.86265, 18.50558], [73.86379, 18.50571], 
    [73.86492, 18.50606], [73.86613, 18.50608]
]

def jitter_coordinate(coord, max_offset=0.00030):
    """Add a tiny random offset to a [lon, lat] coordinate to prevent overlapping."""
    lon_offset = random.uniform(-max_offset, max_offset)
    lat_offset = random.uniform(-max_offset, max_offset)
    return [coord[0] + lon_offset, coord[1] + lat_offset]

def generate_jittered_route(base_route):
    """Return a new route based on the base route with jittered coordinates."""
    return [jitter_coordinate(coord) for coord in base_route]

def smooth_route_generator(route, step_size=0.00005):
    """
    Smoothly iterate through a list of coordinates, interpolating between points.
    Yields indefinitely for circular route simulation.
    """
    def interpolate(p1, p2, t):
        """Linearly interpolate between p1 and p2 with t in [0, 1]"""
        lon = p1[0] + (p2[0] - p1[0]) * t
        lat = p1[1] + (p2[1] - p1[1]) * t
        return (lon, lat)

    def distance(p1, p2):
        """Euclidean distance"""
        return math.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)

    idx = 0
    while True:
        start = route[idx]
        end = route[(idx + 1) % len(route)]
        dist = distance(start, end)
        steps = max(int(dist / step_size), 1)

        for i in range(steps):
            t = i / steps
            yield interpolate(start, end, t)

        idx = (idx + 1) % len(route)

async def simulate_vehicle(vehicle_id, route):
    """Connect to WebSocket and periodically send telemetry data for one vehicle."""
    gen = smooth_route_generator(route, step_size=0.00005)
    speed = random.uniform(30.0, 70.0)
    fuel = random.uniform(40.0, 100.0)
    
    # Random initial wait to stagger startups
    await asyncio.sleep(random.uniform(0.1, 2.0))

    while True:
        try:
            async with websockets.connect(URI) as websocket:
                print(f"[{vehicle_id}] Connected to {URI}")
                while True:
                    # Randomly adjust speed within reasonable bounds (0 to 120 km/h)
                    speed += random.uniform(-5, 5)
                    speed = max(0, min(speed, 120)) 
                    
                    # Slowly decrease fuel, refuel if empty
                    fuel -= random.uniform(0.05, 0.2) 
                    if fuel <= 0.5:
                        fuel = 100.0
                    
                    # Initialize heading if not set, else wobble it slightly for realism
                    if 'initial_heading' not in locals():
                        initial_heading = random.uniform(0, 360)
                    else:
                        initial_heading = (initial_heading + random.uniform(-5, 5)) % 360
                    
                    point = next(gen)
                    timestamp = datetime.now().isoformat()
                    
                    payload = {
                        "vehicle_id": vehicle_id,
                        "latitude": point[1],
                        "longitude": point[0],
                        "speed": speed,
                        "heading": initial_heading,
                        "fuelLeft": fuel,
                        "timestamp": timestamp
                    }
                    
                    try:
                        await websocket.send(json.dumps(payload))
                        print(f"[{vehicle_id}] Sent -> Speed: {speed:.1f}, Fuel: {fuel:.1f} at {timestamp}")
                    except websockets.ConnectionClosed:
                        raise  # Caught outer trying to connect
                    
                    # Heartbeat interval every 2-5 seconds
                    await asyncio.sleep(random.uniform(2.0, 5.0))
        
        except (websockets.ConnectionClosed, ConnectionRefusedError, OSError) as e:
            print(f"[{vehicle_id}] Connection error: {e}. Retrying in 5s...")
            await asyncio.sleep(5)
        except Exception as e:
            print(f"[{vehicle_id}] Unexpected error: {e}")
            await asyncio.sleep(5)

async def main():
    print("Starting Multi-Vehicle IoT Simulator 24/7...")
    tasks = []
    
    for i in range(1, NUM_VEHICLES + 1):
        v_id = f"{VEHICLE_PREFIX}{i:03d}"
        # Give approximately half on ROUTE_1 and half on ROUTE_2
        base_route = ROUTE_1 if i % 2 == 1 else ROUTE_2
        
        # Add jitter to create unique lanes/paths
        jittered_route = generate_jittered_route(base_route)
        
        # Schedule the vehicle task
        task = asyncio.create_task(simulate_vehicle(v_id, jittered_route))
        tasks.append(task)
    
    # Run forever
    await asyncio.gather(*tasks)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nSimulation stopped safely.")