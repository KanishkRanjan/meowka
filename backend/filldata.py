import requests
import time
import random
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:3000/api/vehicles"  # Change this to your actual API base URL
VEHICLE_IDS = ["VH002", "VH003"]  # Your vehicle IDs

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

# Define vehicle routes
VEHICLE_ROUTES = {
    "VH002": ROUTE_1,
    "VH003": ROUTE_2
}

        
        # print(f"Generated {len(all_data)} tracking points for vehicle {vehicle_id}")
        
        # # Submit data to API
        # for point in all_data:
        #     try:
        #         response = requests.post(
        #             f"{BASE_URL}/addinfo/{vehicle_id}", 
        #             json=point
        #         )
                
        #         if response.status_code == 200:
        #             print(f"Successfully added point for {vehicle_id} at {point['timestamp']}")
        #         else:
        #             print(f"Failed to add point: {response.status_code} - {response.text}")
                
        #         # Small delay to prevent overwhelming the server
        #         time.sleep(0.2)
                
        #     except Exception as e:
        #         print(f"Error adding point: {str(e)}")

from datetime import datetime, timedelta

def generate_timestamps(date_str, interval_seconds=10):
    """
    Generate timestamps from 12:00 AM to 12:00 PM on a given date.
    
    Parameters:
        date_str (str): Date in 'YYYY-MM-DD' format
        interval_seconds (int): Gap between timestamps in seconds
    
    Returns:
        list of str: List of ISO-formatted timestamps
    """
    start_time = datetime.strptime(date_str + "T00:00:00", "%Y-%m-%dT%H:%M:%S")
    end_time = datetime.strptime(date_str + "T00:00:00", "%Y-%m-%dT%H:%M:%S")
    end_time += timedelta(days=1)

    timestamps = []
    current_time = start_time

    while current_time <= end_time:
        timestamps.append(current_time.isoformat())
        current_time += timedelta(seconds=interval_seconds)

    return timestamps


def smooth_route_generator(route, step_size=0.00005):
        """
        Smoothly iterate through a list of coordinates, interpolating between points.

        Parameters:
            route (list): List of [lon, lat] points
            step_size (float): Small step for interpolation (smaller = smoother)

        Yields:
            tuple: (longitude, latitude)
        """
        import math

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





def fill_data(timestamp_list , vehicle_id,route):
    gen = smooth_route_generator(route)

    speed = 50
    fuel = 43

    for timestamp in timestamp_list:
        # Randomly increase or decrease speed by up to 5 units
        speed += random.uniform(-3, 3)
        speed = max(speed, 0)  # prevent negative speed

        # Randomly increase or decrease fuel by up to 1 unit
        fuel += random.uniform(-0.5, 0.5)
        fuel = max(fuel, 0)  # prevent negative fuel

        print(f"Timestamp: {timestamp}, Speed: {speed:.2f}, Fuel: {fuel:.2f}")
        print(next(gen))
        point = {
            "latitude": next(gen)[1],
            "longitude": next(gen)[0],
            "timestamp": timestamp,
            "speed": speed,
            "fuel": fuel
        }
        try:
            response = requests.post(
                f"{BASE_URL}/addinfo/{vehicle_id}", 
                json=point
            )
            if response.status_code == 200:
                print(f"Successfully added point for {vehicle_id} at {point['timestamp']}")
            else:
                print(f"Failed to add point: {response.status_code} - {response.text}")

            time.sleep(0.02)
        except Exception as e:
            print(f"Error adding point: {str(e)}")




if __name__ == "__main__":
    print("Starting vehicle tracking data simulation...")
    # simulate_one_day()
    ts_list = generate_timestamps("2025-04-14");

    for vehicle_id, route in VEHICLE_ROUTES.items():
        fill_data(ts_list, vehicle_id,route)
    print("Simulation complete!")