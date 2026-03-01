import React, { useRef, useEffect, useState } from 'react';

const VehicleDetail = ({ vehicle, onClose , handleShowTrackHistory   }) => {

  const panelRef = useRef(null);
  // State for track history form visibility
  const [showHistoryForm, setShowHistoryForm] = useState(false);

  
  // State for date and time inputs
  const [historyDate, setHistoryDate] = useState('');
  const [historyTime, setHistoryTime] = useState('');
  const [endHistoryTime, setEndHistoryTime] = useState('');
  
  // State for loading track history
  const [isLoading, setIsLoading] = useState(false);
  
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
    const today = new Date();
  
    // Format to YYYY-MM-DD for the input[type="date"]
    // We construct it manually to ensure local timezone is used instead of UTC
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    // Default to the beginning of the current day
    const timeString = '00:00'; 
  
    // Default end time to current current time
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    const endTimeString = `${hours}:${minutes}`; 
    
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
  
  // Get days until next service and format warning
  const getDaysUntilService = () => {
    const today = new Date();
    const nextService = new Date(vehicle.next_service_due);
    const diffTime = nextService - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <span style={{ color: 'var(--low-fuel-color)', fontWeight: 'bold' }}>Overdue by {Math.abs(diffDays)} days</span>;
    } else if (diffDays <= 7) {
      return <span style={{ color: 'var(--idle-color)', fontWeight: 'bold' }}>Due in {diffDays} days</span>;
    }
    
    return `${diffDays} days`;
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
    setIsLoading(true);
    try {
      const url = `${import.meta.env.VITE_API_BASE_URL}/api/vehicles/trackdata/${vehicle.id}?date=${historyDate}&startTime=${historyTime}&endTime=${endHistoryTime}`;
      const response = await fetch(url);
      const data = await response.json();
      if (!data.success) {
        console.error('Error fetching track history:', data.message);
        setIsLoading(false);
        return;
      }
      
      console.log('Track History Data:', data.data);
      handleShowTrackHistory({vehicle , historyDate, historyTime, endHistoryTime, track_history: data.data});
    } catch (error) {
      console.error('Error fetching track history:', error);
    } finally {
      setIsLoading(false);
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
            <div className={`status-indicator ${vehicle.status.toLowerCase().replace(/\s+/g, '-')}`}>
              {vehicle.status}
            </div>
          </div>
          
          {/* Key metrics */}
          <div className="metrics-container">
            <div className="metric-item">
              <div className="metric-icon speed-icon"></div>
              <div className="metric-value">{Number(vehicle.speed || 0).toFixed(2)} km/h</div>
              <div className="metric-label">Speed</div>
            </div>
            
            <div className="metric-item">
              <div className="metric-icon distance-icon"></div>
              <div className="metric-value">{Number(vehicle.distance || 0).toFixed(2)} km</div>
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
                <div className="detail-value">{Number(vehicle.total_distance || 0).toFixed(2)}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Status</div>
                <div className="detail-value">{vehicle.status || "Idle"}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">max_speed</div>
                <div className="detail-value">{Number(vehicle.max_speed || 120).toFixed(2)}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">today_running</div>
                <div className="detail-value">{Number(vehicle.today_running || 0).toFixed(2)}</div>
              </div>
            </div>
          </div>
          

          {/* Owner information */}
          <div className="detail-section">
            <h3 className="section-title">Owner Information</h3>
            <div className="owner-info">
              <div className="detail-row">
                <div className="detail-label">Name</div>
                <div className="detail-value">{vehicle.owner?.name || "N/A"}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Contact</div>
                <div className="detail-value">{vehicle.owner?.contact || "N/A"}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Email</div>
                <div className="detail-value">{vehicle.owner?.email || "N/A"}</div>
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
                <div className="detail-value">{getDaysUntilService()}</div>
              </div>
            </div>
          </div>
          
          {/* Location information */}
          <div className="detail-section">
            <h3 className="section-title">Location Information</h3>
            <div className="location-info">
              <div className="detail-row">
                <div className="detail-label">Latitude</div>
                <div className="detail-value">{Number(vehicle.location_coordinates.latitude).toFixed(4)}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Longitude</div>
                <div className="detail-value">{Number(vehicle.location_coordinates.longitude).toFixed(4)}</div>
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
                    disabled={isLoading}
                    style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
                  >
                    {isLoading ? 'Loading...' : 'View History'}
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