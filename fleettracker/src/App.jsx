import { useState, useEffect } from "react";
import "./App.css";
import VehicleList from "./components/VehicleList";
import MapView from "./components/MapView";
import VehicleDetail from "./components/VehicleDetail";

function App() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTrackHistory, setShowTrackHistory] = useState(false);
  const [trackData, setTrackData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  //fetching vehicles from backend
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://meowka-backend.onrender.com/api/vehicles/getall?limit=10"
        );

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const responseData = await response.json();

        if (!responseData.success || !Array.isArray(responseData.data)) {
          throw new Error("API response format is not as expected");
        }

        const vehicles = responseData.data;
        console.log("Vehicles New : ", vehicles[0]);
        // Make sure to include all the fields from the backend
        const transformedData = vehicles.map((vehicle, index) => ({
          id: vehicle.vehicle_id || index + 1,
          name: vehicle.name,
          type: vehicle.type,
          status: vehicle.status || "Parked",
          speed: (vehicle.speed.toFixed(2)) || 0,
          distance: vehicle.distance || 0,
          fuel: Number(vehicle.fuel) || 0,
          position: [
            vehicle.location_coordinates.latitude,
            vehicle.location_coordinates.longitude,
          ],
          owner: vehicle.owner,
          last_service_date: vehicle.last_service_date,
          next_service_due: vehicle.next_service_due,
          location_coordinates: vehicle.location_coordinates,
          number_plate: vehicle.number_plate,
          vehicle_id: vehicle.vehicle_id,
          total_distance: vehicle.total_distance,
          max_speed: vehicle.max_speed || 120,
          today_running: vehicle.today_running || 0,
        }));

        setVehicles(transformedData);
        console.log("Loaded vehicles:", transformedData);
      } catch (err) {
        console.error("Error fetching vehicles:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  const handleCloseTrackHistory = () => {
    setShowTrackHistory(false);
    setTrackData([]);
  };

  const handleShowTrackHistory = (data) => {
    //Checking if the track history is an array
    if (data.track_history && Array.isArray(data.track_history)) {
      //Filtering the track history to only include the required fields
      const processedTrackData = data.track_history.map((point) => ({
        location: [parseFloat(point.latitude), parseFloat(point.longitude)],
        speed: parseFloat(point.speed).toFixed(2),
        timestamp: point.timestamp,
      }));
      //Setting the track data and showing the track history
      setTrackData(processedTrackData);
      setShowTrackHistory(true);
    }
    else {
      alert("No record found");
    }

    //Closing the detail view
    handleCloseDetail();
  };

  const handleSelectVehicle = (vehicle) => {
    //Setting the selected vehicle and showing the detail view
    setSelectedVehicle(vehicle);
    setShowDetail(true);
    handleCloseTrackHistory();
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
  };

  //filtering vehicles based on search query
  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.number_plate.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="loading-container">Loading vehicle data...</div>;
  }

  if (error && vehicles.length === 0) {
    return <div className="error-container">Error: {error}</div>;
  }

  const hasVehicles =
    filteredVehicles &&
    Array.isArray(filteredVehicles) &&
    filteredVehicles.length > 0;

  return (
    <div className="app-container">
      <header>
        <h1>Meowka</h1>
      </header>
      <div className="main-content">
        <aside className="sidebar">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {hasVehicles ? (
            <VehicleList
              vehicles={filteredVehicles}
              onSelectVehicle={handleSelectVehicle}
              selectedVehicle={selectedVehicle}
            />
          ) : (
            <div className="empty-list-message">
              <p>No vehicles found in the system</p>
              <p>Vehicles will appear here when available</p>
            </div>
          )}
        </aside>
        <main className="map-container">
          <div className="tracking-header">
            <h2>
              Tracking:{" "}
              {selectedVehicle
                ? selectedVehicle.name
                : hasVehicles
                ? "Select a vehicle"
                : "No vehicles available"}
            </h2>
          </div>
          <MapView
            vehicles={vehicles}
            selectedVehicle={selectedVehicle}
            trackData={trackData}
            showTrackHistory={showTrackHistory}
            setShowTrackHistory={setShowTrackHistory}
            handleCloseTrackHistory={handleCloseTrackHistory}
          />
          {showDetail && selectedVehicle && (
            <div className="detail-overlay">
              <VehicleDetail
                vehicle={selectedVehicle}
                onClose={handleCloseDetail}
                handleShowTrackHistory={handleShowTrackHistory}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
