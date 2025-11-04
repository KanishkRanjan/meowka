import React, { useRef, useEffect, useState } from 'react';

const VehicleDetail = ({ vehicle, onClose , handleShowTrackHistory   }) => {

  const panelRef = useRef(null);
  // State for track history form visibility
  const [showHistoryForm, setShowHistoryForm] = useState(false);

  
  // State for date and time inputs
  const [historyDate, setHistoryDate] = useState('');
  const [historyTime, setHistoryTime] = useState('');
  const [endHistoryTime, setEndHistoryTime] = useState('');
  
  // Format the current time (for demonstration purposes)
  const currentDate = new Date();
  const formattedDate = `${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  
  // Format service dates
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Set default date and time values (today's date, current time)
  useEffect(() => {
    //Setting it for demo purposes
    const fixedDate = new Date('2025-04-14T00:00:00');
  
    const dateString = fixedDate.toISOString().split('T')[0];
    const timeString = '00:00'; 
  
    const endTime = new Date(fixedDate);
    endTime.setHours(endTime.getHours() + 1);
    const endTimeString = endTime.toTimeString().slice(0, 5); 
    console.log(dateString);
    setHistoryDate(dateString);
    setHistoryTime(timeString);
    setEndHistoryTime(endTimeString);
  }, []);

  // Determine if fuel is a percentage or fuel type
  const isFuelPercentage = typeof vehicle.fuel === 'number';
  
  // Effect to reset scroll position when vehicle changes
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, [vehicle.id]);
  
  // Get days until next service
  const getDaysUntilService = () => {
    const today = new Date();
    const nextService = new Date(vehicle.next_service_due);
    const diffTime = nextService - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  // Handle track history button click
  const toggleHistoryForm = () => {
    setShowHistoryForm(!showHistoryForm);
    
    // If showing the form, scroll to it
    if (!showHistoryForm && panelRef.current) {
      setTimeout(() => {
        panelRef.current.scrollTo({
          top: panelRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  };
  
  // Handle view history click
  const handleViewHistory = async () => {
    try {
      const url = `https://meowka-backend.onrender.com/api/vehicles/trackdata/${vehicle.id}?date=${historyDate}&startTime=${historyTime}&endTime=${endHistoryTime}`;
      const response = await fetch(url);
      const data = await response.json();
      if (!data.success) {
        console.error('Error fetching track history:', data.message);
        return;
      }
      
      console.log('Track History Data:', data.data);
      handleShowTrackHistory({vehicle , historyDate, historyTime, endHistoryTime, track_history: data.data});
    } catch (error) {
      console.error('Error fetching track history:', error);
    }
  };
  
  return (
    <div className="detail-overlay" onClick={onClose}>
      <div 
        className={`vehicle-detail-panel ${vehicle ? 'show' : ''}`}
        onClick={e => e.stopPropagation()}
        ref={panelRef}
      >
        {/* Fixed header that doesn't scroll */}
        <div className="detail-header">
          <div className="vehicle-type-badge">{vehicle.type.toUpperCase()}</div>
          <div className="timestamp">{formattedDate}</div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {/* Scrollable content */}
        <div className="detail-content">
          {/* Summary section */}
          <div className="detail-summary">
            <h2 className="vehicle-name">{vehicle.name}</h2>
            <div className={`status-indicator ${vehicle.status.toLowerCase()}`}>
              {vehicle.status}
            </div>
          </div>
          
          {/* Key metrics */}
          <div className="metrics-container">
            <div className="metric-item">
              <div className="metric-icon speed-icon"></div>
              <div className="metric-value">{vehicle.speed} km/h</div>
              <div className="metric-label">Speed</div>
            </div>
            
            <div className="metric-item">
              <div className="metric-icon distance-icon"></div>
              <div className="metric-value">{vehicle.distance.toFixed(2)} km</div>
              <div className="metric-label">Distance</div>
            </div>
            
            <div className="metric-item">
              <div className="metric-icon battery-icon"></div>
              <div className="metric-value">
                {isFuelPercentage ? `${vehicle.fuel}%` : vehicle.fuel}
              </div>
              <div className="metric-label">{isFuelPercentage ? 'Battery' : 'Fuel'}</div>
            </div>
          </div>
          
          {/* Vehicle basic info */}
          <div className="detail-section">
            <h3 className="section-title">Vehicle Information</h3>
            <div className="vehicle-basic-info">
              {vehicle.number_plate && (
                <div className="detail-row">
                  <div className="detail-label">Number Plate</div>
                  <div className="detail-value">{vehicle.number_plate}</div>
                </div>
              )}
              <div className="detail-row">
                <div className="detail-label">Type</div>
                <div className="detail-value">{vehicle.type}</div>
              </div>
              {!isFuelPercentage && (
                <div className="detail-row">
                  <div className="detail-label">Fuel Type</div>
                  <div className="detail-value">{vehicle.fuel}</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Meta Data information */}
          <div className="detail-section">
            <h3 className="section-title">Meta Data</h3>
            <div className="owner-info">
                <div className="detail-row">
                <div className="detail-label">Total Distance</div>
                <div className="detail-value">{vehicle.total_distance || 0}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Status</div>
                <div className="detail-value">{vehicle.status || "Idle"}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">max_speed</div>
                <div className="detail-value">{vehicle.max_speed || 120}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">today_running</div>
                <div className="detail-value">{vehicle.today_running || 0}</div>
              </div>
            </div>
          </div>
          

          {/* Owner information */}
          <div className="detail-section">
            <h3 className="section-title">Owner Information</h3>
            <div className="owner-info">
              <div className="detail-row">
                <div className="detail-label">Name</div>
                <div className="detail-value">{vehicle.owner.name}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Contact</div>
                <div className="detail-value">{vehicle.owner.contact}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Email</div>
                <div className="detail-value">{vehicle.owner.email}</div>
              </div>
            </div>
          </div>
          
          {/* Service information */}
          <div className="detail-section">
            <h3 className="section-title">Service Information</h3>
            <div className="service-info">
              <div className="detail-row">
                <div className="detail-label">Last Service</div>
                <div className="detail-value">{formatDate(vehicle.last_service_date)}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Next Service Due</div>
                <div className="detail-value">{formatDate(vehicle.next_service_due)}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Days Until Service</div>
                <div className="detail-value">{getDaysUntilService()} days</div>
              </div>
            </div>
          </div>
          
          {/* Location information */}
          <div className="detail-section">
            <h3 className="section-title">Location Information</h3>
            <div className="location-info">
              <div className="detail-row">
                <div className="detail-label">Latitude</div>
                <div className="detail-value">{vehicle.location_coordinates.latitude}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Longitude</div>
                <div className="detail-value">{vehicle.location_coordinates.longitude}</div>
              </div>
            </div>
          </div>
          
          {/* Track History Section */}
          <div className="detail-section history-section">
            <h3 className="section-title">Track History</h3>
            
            {showHistoryForm ? (
              <div className="history-form">
                <div className="form-row">
                  <label htmlFor="history-date">Select Date:</label>
                  <input 
                    type="date" 
                    id="history-date" 
                    value={historyDate} 
                    onChange={(e) => setHistoryDate(e.target.value)}
                  />
                </div>
                
                <div className="form-row">
                  <label htmlFor="history-time">Starting Time:</label>
                  <input 
                    type="time" 
                    id="history-time" 
                    value={historyTime} 
                    onChange={(e) => setHistoryTime(e.target.value)}
                  />
                </div>
                
                <div className="form-row">
                  <label htmlFor="end-history-time">Ending Time:</label>
                  <input 
                    type="time" 
                    id="end-history-time" 
                    value={endHistoryTime} 
                    onChange={(e) => setEndHistoryTime(e.target.value)}
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    className="history-action-btn view-btn" 
                    onClick={handleViewHistory}
                  >
                    View History
                  </button>
                  <button 
                    className="history-action-btn cancel-btn" 
                    onClick={toggleHistoryForm}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button 
                className="track-history-btn" 
                onClick={toggleHistoryForm}
              >
                <span className="history-icon"></span>
                Track Vehicle History
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetail; 