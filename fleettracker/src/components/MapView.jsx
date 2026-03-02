import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polyline,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import busImage from "/src/assets/bus.png";

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
  const [zoomLevel, setZoomLevel] = useState(12);

// Listener to accurately track zoom levels
const ZoomListener = ({ setZoomLevel }) => {
  useMapEvents({
    zoomend: (e) => setZoomLevel(e.target.getZoom()),
    zoomstart: (e) => setZoomLevel(e.target.getZoom()),
  });
  return null;
};

// Component to handle map recentering when a vehicle is selected
const MapCenter = ({ selectedVehicle, showTrackHistory, displayedTrackData }) => {
  const map = useMap();
  const lastVehicleIdRef = useRef(null);

  useEffect(() => {
    // If showing history, fit the map to the entire history route bounds ONCE when data loads
    if (showTrackHistory && displayedTrackData && displayedTrackData.length > 0) {
      const latLngs = displayedTrackData
        .map(pt => pt.location)
        .filter(loc => Array.isArray(loc) && loc.length === 2 && !isNaN(loc[0]) && !isNaN(loc[1]))
        .map(loc => [parseFloat(loc[0]), parseFloat(loc[1])]);
        
      if (latLngs.length > 0) {
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, duration: 1.5 });
      }
    } 
    // Otherwise, focus on the live vehicle if selected
    else if (selectedVehicle && selectedVehicle.position && !showTrackHistory) {
      const [lat, lng] = [parseFloat(selectedVehicle.position[0]), parseFloat(selectedVehicle.position[1])];
      const isNewVehicle = lastVehicleIdRef.current !== selectedVehicle.id;
      
      // Convert LatLng to screen coordinates to make threshold "zoom-aware"
      const currentLatLng = L.latLng(lat, lng);
      const currentPoint = map.latLngToContainerPoint(currentLatLng);
      const centerPoint = map.getSize().divideBy(2);
      const pixelDist = currentPoint.distanceTo(centerPoint);

      // Threshold in pixels: only re-center if vehicle is > 15 pixels from center
      const pixelThreshold = 15;

      if (isNewVehicle) {
        map.flyTo([lat, lng], 15, { duration: 1.5 });
        lastVehicleIdRef.current = selectedVehicle.id;
      } else if (pixelDist > pixelThreshold) {
        // Smoothly pan over 2.5 seconds (polling is every 5s) to create fluid motion
        map.panTo([lat, lng], { animate: true, duration: 2.5, easeLinearity: 0.25 });
      }
    }
  }, [selectedVehicle, showTrackHistory, map]); 
  return null;
}; 

  // Calculate heading based on two lat/lng points
  const calculateHeading = (lat1, lon1, lat2, lon2) => {
    if (lat1 === lat2 && lon1 === lon2) return 0;
    
    // Convert to radians
    const radLat1 = lat1 * Math.PI / 180;
    const radLat2 = lat2 * Math.PI / 180;
    const deltaLon = (lon2 - lon1) * Math.PI / 180;

    const y = Math.sin(deltaLon) * Math.cos(radLat2);
    const x = Math.cos(radLat1) * Math.sin(radLat2) -
              Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(deltaLon);
    
    // Convert back to degrees
    let heading = Math.atan2(y, x) * 180 / Math.PI;
    
    // Normalize to 0-360
    heading = (heading + 360) % 360;
    
    return heading;
  };


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

  // Custom marker icons based on vehicle type and zoom level
  const createVehicleIcon = (isSelected, status, heading = 0) => {
    // Uber-style sizing: scale size according to zoom level
    let size = 48; // default
    if (zoomLevel <= 11) size = 12; // Far away -> tiny dots
    else if (zoomLevel === 12) size = 20; 
    else if (zoomLevel === 13) size = 28;
    else if (zoomLevel === 14) size = 36;
    else if (zoomLevel >= 15) size = 48; // Zoomed in -> full size

    const isTiny = size <= 14;

    // Use a stable HTML string. Leaflet is sensitive to HTML changes.
    // Adding a transition to the rotation makes it smoother.
    const imageHtml = isTiny && !isSelected
        ? `<div style="width: ${size*0.6}px; height: ${size*0.6}px; background-color: #1a1a1a; border-radius: 50%; border: 1.5px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.5); pointer-events: none;"></div>`
        : `<img src="${busImage}" style="height: ${size}px; width: auto; transform: rotate(${heading}deg); transition: transform 0.8s linear, height 0.2s ease; mix-blend-mode: multiply; pointer-events: none;" />`;

    return L.divIcon({
      className: `vehicle-marker ${isSelected ? "selected" : ""}`,
      html: `<div class="marker-container" style="display: flex; justify-content: center; align-items: center; width: ${size}px; height: ${size}px;">${imageHtml}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
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
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <ZoomListener setZoomLevel={setZoomLevel} />
        <MapCenter 
          selectedVehicle={selectedVehicle}
          showTrackHistory={showTrackHistory}
          displayedTrackData={displayedTrackData}
        />

        {vehicles &&
          vehicles.map((vehicle) => {
             // Hide the static marker if we are currently showing track history for this vehicle
             if (showTrackHistory && selectedVehicle && selectedVehicle.id === vehicle.id) {
               return null;
             }

             // For general view, we need heading. Since we only have current position in 'vehicles', 
             // ideally we need previous position in the data stream. Assuming vehicle.heading exists.
             // If not, it defaults to 0. You can also derive from history if present.
             const heading = vehicle.heading || 0;
             return (
              <Marker
                key={vehicle.id}
         
                position={[
                  parseFloat(vehicle.position[0]),
                  parseFloat(vehicle.position[1]),
                ]}
                icon={createVehicleIcon(
                  selectedVehicle && selectedVehicle.id === vehicle.id,
                  vehicle.status || "Parked",
                  heading
                )}
              >
                <Popup>
                  <div>
                    <h3>{vehicle.name}</h3>
                    <p>{vehicle.status}</p>
                  </div>
                </Popup>
              </Marker>
             )
          })}
        {showTrackHistory &&
          displayedTrackData.length > 0 &&
          displayedTrackData[currentPosition] &&
          Array.isArray(displayedTrackData[currentPosition].location) &&
          displayedTrackData[currentPosition].location.length === 2 &&
          !isNaN(parseFloat(displayedTrackData[currentPosition].location[0])) &&
          !isNaN(
            parseFloat(displayedTrackData[currentPosition].location[1])
          ) && (() => {
            // Calculate heading based on previous position if available
            let heading = 0;
            if (currentPosition > 0 && displayedTrackData[currentPosition - 1]) {
               const prev = displayedTrackData[currentPosition - 1].location;
               const curr = displayedTrackData[currentPosition].location;
               heading = calculateHeading(parseFloat(prev[0]), parseFloat(prev[1]), parseFloat(curr[0]), parseFloat(curr[1]));
            }
            return (
              <Marker
                position={[
                  parseFloat(displayedTrackData[currentPosition].location[0]),
                  parseFloat(displayedTrackData[currentPosition].location[1]),
                ]}
                icon={createVehicleIcon(false, "track-history", heading)}
              />
            )
          })()}

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
