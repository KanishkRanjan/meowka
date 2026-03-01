import asyncio
import json
import random
import os
import requests
from google.transit import gtfs_realtime_pb2
import websockets
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

# Configuration
WS_URI = os.getenv("WS_URI", "ws://localhost:3000")

API_KEY = os.getenv("DELHI_API_KEY", "YOUR_API_KEY") 
GTFS_URL = f"https://otd.delhi.gov.in/api/realtime/VehiclePositions.pb?key={API_KEY}"
POLL_INTERVAL_SECONDS = 10

# Max number of buses to track at once so we don't overwhelm the local server (optional scaling)
MAX_BUSES_TO_TRACK = 50 

async def fetch_and_push_gtfs_data(websocket):
    """Fetches GTFS data and pushes updates to the WebSocket server."""
    try:
        # 1. Fetch the GTFS Realtime Protobuf Feed
        response = requests.get(GTFS_URL, timeout=10)
        
        if response.status_code != 200:
            print(f"Failed to fetch GTFS data: HTTP {response.status_code}")
            return
            
        feed = gtfs_realtime_pb2.FeedMessage()
        feed.ParseFromString(response.content)

        # 2. Extract vehicle entities
        buses = []
        for entity in feed.entity:
            if entity.HasField('vehicle') and entity.vehicle.HasField('position'):
                v = entity.vehicle
                bus_id = v.vehicle.id if v.vehicle.id else f"BUS_{entity.id}"
                
                # We prefix with "DELHI_" to clearly identify them in the DB
                if not bus_id.startswith("DELHI_"):
                    bus_id = f"DELHI_{bus_id}"

                buses.append({
                    "vehicle_id": bus_id,
                    "latitude": v.position.latitude,
                    "longitude": v.position.longitude,
                    # Fallback to random if speed not provided in GTFS
                    "speed": v.position.speed if v.position.HasField('speed') else random.uniform(20.0, 60.0), 
                    "timestamp": v.timestamp if v.HasField('timestamp') else int(datetime.now().timestamp()),
                })
        
        print(f"Fetched {len(buses)} bus positions from Delhi OTD.")

        # Limit the number of buses processed if needed for local testing
        buses_to_process = buses[:MAX_BUSES_TO_TRACK]

        # 3. Push each extracted bus to the WebSocket server
        for bus in buses_to_process:
            # We don't get fuel from GTFS, so simulate it
            fuel = random.uniform(50.0, 100.0) 
            
            # Format timestamp for the Node backend
            dt = datetime.fromtimestamp(bus["timestamp"])
            iso_timestamp = dt.isoformat()

            payload = {
                "vehicle_id": bus["vehicle_id"],
                "latitude": bus["latitude"],
                "longitude": bus["longitude"],
                "speed": bus["speed"],
                "fuelLeft": fuel,
                "timestamp": iso_timestamp
            }

            try:
                await websocket.send(json.dumps(payload))
                print(f"[{bus['vehicle_id']}] Sent location -> {bus['latitude']}, {bus['longitude']}")
                await asyncio.sleep(0.01) # Small delay to prevent flooding the local DB
            except websockets.exceptions.ConnectionClosed:
                print("WebSocket connection closed by the server.")
                raise  # Raise to trigger top-level reconnect
                
    except requests.exceptions.RequestException as e:
        print(f"Network error fetching GTFS: {e}")
    except websockets.exceptions.ConnectionClosed as e:
        raise e
    except Exception as e:
        print(f"Unexpected error parsing GTFS: {e}")

async def main():
    if API_KEY == "YOUR_API_KEY":
        print("WARNING: DELHI_API_KEY is not set correctly in your .env file or environment.")
        print("Requests to the Delhi OTD portal will likely fail.")
        
    print(f"Starting Delhi OTD GTFS Consumer 24/7...")
    print(f"Connecting to Backend WS: {WS_URI}")
    
    while True:
        try:
            async with websockets.connect(WS_URI) as websocket:
                print(f"Connected to backend {WS_URI} successfully.")
                
                while True:
                    await fetch_and_push_gtfs_data(websocket)
                    # The government portal updates roughly every 10 seconds.
                    await asyncio.sleep(POLL_INTERVAL_SECONDS)
                    
        except (websockets.ConnectionClosed, ConnectionRefusedError, OSError) as e:
            print(f"Backend WS Connection Error: {e}. Retrying in 5s...")
            await asyncio.sleep(5)
            
if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nRealtime GTFS seeder stopped.")
