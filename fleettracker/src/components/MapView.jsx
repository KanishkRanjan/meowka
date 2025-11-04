import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import carImage from "/src/assets/car.png";

// Fix Leaflet's default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Map Controls component that has access to the map instance
function MapControls({ vehicles }) {
  const map = useMap();

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  // Direction control handlers
  const handleMoveUp = () => {
    map.panBy([0, -100]); // Move up by 100 pixels
  };

  const handleMoveDown = () => {
    map.panBy([0, 100]); // Move down by 100 pixels
  };

  const handleMoveLeft = () => {
    map.panBy([-100, 0]); // Move left by 100 pixels
  };

  const handleMoveRight = () => {
    map.panBy([100, 0]); // Move right by 100 pixels
  };

  // Center view handler by vehicle position
  const handleCenterView = () => {
    if (vehicles && vehicles.length > 0) {
      try {
        const bounds = L.latLngBounds(
          vehicles.map((v) => [
            parseFloat(v.position[0]),
            parseFloat(v.position[1]),
          ])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      } catch (err) {
        console.error("Error centering map:", err);
        if (vehicles[0] && vehicles[0].position) {
          map.setView(
            [
              parseFloat(vehicles[0].position[0]),
              parseFloat(vehicles[0].position[1]),
            ],
            12
          );
        }
      }
    }
  };

  useEffect(() => {
    handleCenterView();
  }, []);

  return (
    <>
      {/* Standard map controls */}
      <div className="map-nav-controls" >
        <button
          className="map-control-btn"
          onClick={handleZoomIn}
          aria-label="Zoom in"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button
          className="map-control-btn"
          onClick={handleZoomOut}
          aria-label="Zoom out"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button
          className="map-control-btn"
          onClick={handleCenterView}
          aria-label="Center view"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </button>
      </div>

      {/* Direction controls */}
      <div className="map-direction-controls">
        <button
          className="map-control-btn direction-up"
          onClick={handleMoveUp}
          aria-label="Move up"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>

        <div className="direction-middle-row">
          <button
            className="map-control-btn direction-left"
            onClick={handleMoveLeft}
            aria-label="Move left"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <button
            className="map-control-btn direction-right"
            onClick={handleMoveRight}
            aria-label="Move right"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <button
          className="map-control-btn direction-down"
          onClick={handleMoveDown}
          aria-label="Move down"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
    </>
  );
}

const MapView = ({
  vehicles,
  selectedVehicle,
  trackData = [],
  showTrackHistory = false,
  setShowTrackHistory,
  handleCloseTrackHistory,
}) => {
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState("1x");
  const [currentPosition, setCurrentPosition] = useState(0);
  const [speedDropdownOpen, setSpeedDropdownOpen] = useState(false);
  const [displayedTrackData, setDisplayedTrackData] = useState([]);
  const [speed, setSpeed] = useState(0);
  const [status, setStatus] = useState("Idle");

  //formating date for user readable format
  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  };

  const handleCloseDetail = () => {
    setIsPlaying(false);
    handleCloseTrackHistory();
    setDisplayedTrackData([]);
    setShowTrackHistory(false);
    setCurrentPosition(0);
  };  
  //handling sliding change in track history
  const handleTimeSliderChange = (pos) => {
    const newPosition = parseInt(pos);
    setCurrentPosition(newPosition);
    setSpeed(displayedTrackData[newPosition].speed || 0);
    setStatus(displayedTrackData[newPosition].status || "Idle");
  };

  //setting time for track history slider
  let startTime = formatDate(new Date());
  let endTime = formatDate(new Date());

  // Update displayed track data when trackData changes
  useEffect(() => {
    if (trackData && trackData.length > 0) {
      setDisplayedTrackData(trackData);
    }
  }, [trackData]);

  //handling playback speed
  useEffect(() => {
    const playbackRate = playbackSpeed.split("x")[0];
    let interval = null;
    if (isPlaying) {
      let currentPositionLocal = currentPosition;
      interval = setInterval(() => {
        handleTimeSliderChange(++currentPositionLocal);
        if (currentPositionLocal >= displayedTrackData.length - 1) {
          setIsPlaying(false);
          clearInterval(interval);
        }
      }, 1000 / playbackRate);
      return () => {
        clearInterval(interval);
      };
    } else {
      clearInterval(interval);
    }
  }, [isPlaying, playbackSpeed]);

  // Get center position from vehicles or use default
  const getCenter = () => {
    if (!vehicles || vehicles.length === 0) {
      return [26.8467, 80.9462]; // Default center
    }
    // Use first vehicle position as center
    return [
      parseFloat(vehicles[0].position[0]),
      parseFloat(vehicles[0].position[1]),
    ];
  };

  // Custom marker icons based on vehicle type
  const createVehicleIcon = (isSelected, status) => {

    return L.divIcon({
      className: `vehicle-marker ${isSelected ? "selected" : ""}`,
      html: `
        <div class="marker-icon-img status-badge ${((status || "Parked")).toLocaleString().toLowerCase()}">
          <img src="${carImage}" style="height: 28px;" />
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });
  };

  // Force map resize when container changes
  useEffect(() => {
    setMapReady(true);
  }, []);

  // Show loading indicator while map initializes
  if (!mapReady) {
    return (
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        Loading map...
      </div>
    );
  }

  //setting start and end time for track history from user chosen vehicle
  if (displayedTrackData.length !== 0) {
    startTime = formatDate(displayedTrackData[0].timestamp);
    endTime = formatDate(
      displayedTrackData[displayedTrackData.length - 1].timestamp
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className="map-container"
      style={{ position: "relative", height: "100%", width: "100%" }}
    >
      <MapContainer
        center={getCenter()}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        doubleClickZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {vehicles &&
          vehicles.map((vehicle) => (
            <Marker
              key={vehicle.id}
       
              position={[
                parseFloat(vehicle.position[0]),
                parseFloat(vehicle.position[1]),
              ]}
              icon={createVehicleIcon(
                vehicle.type,
                selectedVehicle && selectedVehicle.id === vehicle.id,
                vehicle.status || "Parked"
              )}
            >
              <Popup>
                <div>
                  <h3>{vehicle.name}</h3>
                  <p>{vehicle.status}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        {showTrackHistory &&
          displayedTrackData.length > 0 &&
          displayedTrackData[currentPosition] &&
          Array.isArray(displayedTrackData[currentPosition].location) &&
          displayedTrackData[currentPosition].location.length === 2 &&
          !isNaN(parseFloat(displayedTrackData[currentPosition].location[0])) &&
          !isNaN(
            parseFloat(displayedTrackData[currentPosition].location[1])
          ) && (
            <Marker
              position={[
                parseFloat(displayedTrackData[currentPosition].location[0]),
                parseFloat(displayedTrackData[currentPosition].location[1]),
              ]}
              icon={createVehicleIcon(false, "track-history")}
            />
          )}

        {/* Add polyline for track history if data is available */}
        {displayedTrackData.length > 0 && (
          <Polyline
            positions={displayedTrackData.map((point) => point.location)}
            color="#3b82f6"
            weight={3}
          />
        )}

        <MapControls vehicles={vehicles} />
      </MapContainer>

      {/* Track History Controls */}
      {showTrackHistory && (
        <>
          <div className="track-history-controls">
            <div className="track-history-header">
              <h2 className="track-history-title">Track History</h2>
              <button
                className="close-track-history"
                onClick={handleCloseDetail}
                aria-label="Close track history"
              >
                ×
              </button>
            </div>

            <div className="track-info-panel">
              <div>
                <span className="track-info-label">Total Distance</span>
                <span className="track-info-value">
                  {displayedTrackData[currentPosition]?.distance || 0} km
                </span>
              </div>
              <div>
                <span className="track-info-label">Speed</span>
                <span className="track-info-value">{speed} km/h</span>
              </div>
              <div>
                <span className="track-info-label">Current Status</span>
                <span className="track-info-value">{status}</span>
              </div>
            </div>

            <div className="track-controls">
              <button
                className="play-button"
                onClick={() => setIsPlaying(!isPlaying)}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <span className="pause-icon">⏸</span>
                ) : (
                  <span className="play-icon">▶</span>
                )}
              </button>

              <div className="speed-control">
                <button
                  className="speed-dropdown-button"
                  onClick={() => setSpeedDropdownOpen(!speedDropdownOpen)}
                >
                  {playbackSpeed} <span className="dropdown-arrow">▼</span>
                </button>

                {speedDropdownOpen && (
                  <div className="speed-dropdown">
                    <div
                      className={`speed-option ${
                        playbackSpeed === "0.5x" ? "selected" : ""
                      }`}
                      onClick={() => {
                        setPlaybackSpeed("0.5x");
                        setSpeedDropdownOpen(false);
                      }}
                    >
                      0.5x
                    </div>
                    <div
                      className={`speed-option ${
                        playbackSpeed === "1x" ? "selected" : ""
                      }`}
                      onClick={() => {
                        setPlaybackSpeed("1x");
                        setSpeedDropdownOpen(false);
                      }}
                    >
                      {playbackSpeed === "1x" && (
                        <span className="check-icon">✓</span>
                      )}{" "}
                      1x
                    </div>
                    <div
                      className={`speed-option ${
                        playbackSpeed === "2x" ? "selected" : ""
                      }`}
                      onClick={() => {
                        setPlaybackSpeed("2x");
                        setSpeedDropdownOpen(false);
                      }}
                    >
                      2x
                    </div>
                    <div
                      className={`speed-option ${
                        playbackSpeed === "5x" ? "selected" : ""
                      }`}
                      onClick={() => {
                        setPlaybackSpeed("5x");
                        setSpeedDropdownOpen(false);
                      }}
                    >
                      5x
                    </div>
                    <div
                      className={`speed-option ${
                        playbackSpeed === "10x" ? "selected" : ""
                      }`}
                      onClick={() => {
                        setPlaybackSpeed("10x");
                        setSpeedDropdownOpen(false);
                      }}
                    >
                      10x
                    </div>
                  </div>
                )}
              </div>

              <div className="current-time">{formatDate(new Date())}</div>
            </div>

            <div className="timeline-container">
              <span className="timeline-start">{startTime}</span>
              <input
                type="range"
                min="0"
                max={
                  displayedTrackData.length > 0
                    ? displayedTrackData.length - 1
                    : 100
                }
                value={currentPosition}
                onChange={(e) => handleTimeSliderChange(e.target.value)}
                className="timeline-slider"
              />
              <span className="timeline-end">{endTime}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MapView;
