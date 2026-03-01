import { useState, useEffect, useRef } from "react";
import "./App.css";
import VehicleList from "./components/VehicleList";
import MapView from "./components/MapView";
import VehicleDetail from "./components/VehicleDetail";
import LoadingScreen from "./components/LoadingScreen";
import TitleEffect from "./components/TitleEffect";

function App() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTrackHistory, setShowTrackHistory] = useState(false);
  const [trackData, setTrackData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Store previous vehicles to calculate heading
  const prevVehiclesRef = useRef([]);

  // Calculate heading based on two lat/lng points
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

  //fetching vehicles from backend
  useEffect(() => {
    const fetchVehicles = async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/vehicles/getall?limit=100`
        );

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const responseData = await response.json();

        if (!responseData.success || !Array.isArray(responseData.data)) {
          throw new Error("API response format is not as expected");
        }

        const vehiclesData = responseData.data;
        const previousVehicles = prevVehiclesRef.current;
        
        // Make sure to include all the fields from the backend
        const transformedData = vehiclesData.map((vehicle, index) => {
          const id = vehicle.vehicle_id || index + 1;
          const lat = vehicle.location_coordinates.latitude;
          const lng = vehicle.location_coordinates.longitude;
          
          let heading = 0;
          const prevVehicle = previousVehicles.find(v => v.id === id);
          
          if (prevVehicle && prevVehicle.position) {
            const [prevLat, prevLng] = prevVehicle.position;
            // Only update heading if the vehicle actually moved
            if (lat !== prevLat || lng !== prevLng) {
               heading = calculateHeading(prevLat, prevLng, lat, lng);
            } else {
               heading = prevVehicle.heading || 0; // Keep old heading if stationary
            }
          }

          return {
            id,
            name: vehicle.name,
            type: vehicle.type,
            status: vehicle.status || "Parked",
            speed: vehicle.speed ? vehicle.speed.toFixed(2) : "0.00",
            distance: vehicle.distance ? vehicle.distance.toFixed(2) : "0.00",
            fuel: Number(vehicle.fuel) || 0,
            position: [lat, lng],
            heading,
            owner: vehicle.owner,
            last_service_date: vehicle.last_service_date,
            next_service_due: vehicle.next_service_due,
            location_coordinates: vehicle.location_coordinates,
            number_plate: vehicle.number_plate,
            vehicle_id: vehicle.vehicle_id,
            total_distance: vehicle.total_distance ? vehicle.total_distance.toFixed(2) : "0.00",
            max_speed: (vehicle.max_speed || 120).toFixed(2),
            today_running: vehicle.today_running ? vehicle.today_running.toFixed(2) : "0.00",
          };
        });

        prevVehiclesRef.current = transformedData;
        
        setVehicles(transformedData);
        // Ensure our currently selected vehicle is also updated with fresh live data
        setSelectedVehicle(prev => {
          if (!prev) return prev;
          const updated = transformedData.find(v => v.id === prev.id);
          return updated || prev;
        });

      } catch (err) {
        console.error("Error fetching vehicles:", err);
        setError(err.message);
      } finally {
        if (isInitial) setLoading(false);
      }
    };
    
    // Do an immediate fetch for the initial load
    fetchVehicles(true);

    // Setup an interval to poll for fresh data every 5 seconds
    const intervalId = setInterval(() => {
      fetchVehicles(false);
    }, 5000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const handleCloseTrackHistory = () => {
    setShowTrackHistory(false);
    setTrackData([]);
  };

  const handleShowTrackHistory = (data) => {
    //Checking if the track history is an array
    if (data.track_history && Array.isArray(data.track_history) && data.track_history.length > 0) {
      //Filtering the track history to only include the required fields
      const processedTrackData = data.track_history.map((point) => ({
        location: [parseFloat(point.latitude), parseFloat(point.longitude)],
        speed: parseFloat(point.speed || 0).toFixed(2),
        distance: parseFloat(point.distance || 0).toFixed(2),
        timestamp: point.timestamp,
        status: point.speed > 0 ? (point.speed < 5 ? 'Slow Moving' : 'Moving') : 'Idle'
      }));
      //Setting the track data and showing the track history
      setTrackData(processedTrackData);
      setShowTrackHistory(true);
    }
    else {
      alert("No tracking data found for the selected time range.");
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
    return <LoadingScreen />;
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
        <TitleEffect text="meowka" />
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
