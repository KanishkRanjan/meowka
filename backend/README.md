# Vehicle Tracking API

A RESTful API for tracking vehicles built with Express.js, MongoDB, and Mongoose.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Configure environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=3000
   MONGO_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/your_database
   ```
   Note: Update MONGO_URI with your MongoDB connection string.

3. Run the server:
   - Development mode: `npm run dev`
   - Production mode: `npm start`

## API Endpoints

### Get All Vehicles
- **URL**: `/api/vehicles/getall`
- **Method**: `GET`
- **Response**: List of all vehicles with count

### Add a New Vehicle
- **URL**: `/api/vehicles/addvehicle`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "vehicle_id": "1",
    "name": "Vehicle Name",
    "type": "Car",
    "number_plate": "ABC-123",
    "fuel": "Petrol",
    "owner": {
      "name": "Owner Name",
      "contact": "9876543210",
      "email": "owner@example.com"
    },
    "location_coordinates": {
      "latitude": 18.6120234,
      "longitude": 73.911631
    },
    "last_service_date": "2024-04-13T11:00:23.338Z",
    "next_service_due": "2025-04-13T11:00:23.338Z"
  }
  ```

### Add Tracking Data to Vehicle (Two options)

#### Option 1:
- **URL**: `/api/vehicles/addinfo/:id`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "latitude": 18.6120234,
    "longitude": 73.911631,
    "speed": 60,
    "fuelLeft": 45,
    "timestamp": "2024-04-13T11:00:23.338Z"
  }
  ```
  Note: `timestamp` is optional and defaults to current time.

#### Option 2 (For simulation):
- **URL**: `/api/vehicles/:id`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "latitude": 18.6120234,
    "longitude": 73.911631,
    "speed": 60,
    "fuelLeft": 45,
    "timestamp": "2024-04-13T11:00:23.338Z"
  }
  ```
  Note: `timestamp` is optional and defaults to current time.

### Get Vehicle Information
- **URL**: `/api/vehicles/getinformation/:id`
- **Method**: `GET`
- **Response**: Complete vehicle document with tracking history

### Get Vehicle Track Data for a Specific Date
- **URL**: `/api/vehicles/trackdata/:id?date=YYYY-MM-DD`
- **Method**: `GET`
- **Response**: List of tracking points for the specified date 