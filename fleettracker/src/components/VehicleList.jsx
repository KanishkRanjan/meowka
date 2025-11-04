import React from 'react'

const VehicleList = ({ vehicles, onSelectVehicle, selectedVehicle }) => {
  return (
    <div className="vehicle-list">
      {vehicles.map(vehicle => {
        const isFuelPercentage = typeof vehicle.fuel === 'number';
        
        return (
          <div 
            key={vehicle.id} 
            className={`vehicle-card ${selectedVehicle && selectedVehicle.id === vehicle.id ? 'selected' : ''}`}
            onClick={() => onSelectVehicle(vehicle)}
          >
            <div className="vehicle-header">
              <div className="vehicle-icon">
                <div className="car-icon"></div>
              </div>
              <div className="vehicle-title">
                <h3>{vehicle.name}</h3>
                <p>{vehicle.type}</p>
              </div>
              <div className={`status-message ${vehicle.status.toLowerCase()}`}>
                {vehicle.status}
              </div>
            </div>
            
            <div className="vehicle-details">
              <div className="detail-item">
                <span className="detail-label">Speed</span>
                <span className="detail-value">{vehicle.speed} km/h</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Distance</span>
                <span className="detail-value">{vehicle.distance} km</span>
              </div>
            </div>
            
            {isFuelPercentage ? (
              <div className="fuel-indicator">
                <span className="fuel-label">Fuel</span>
                <div className="fuel-bar-container">
                  <div 
                    className={`fuel-bar ${vehicle.fuel <= 15 ? 'low-fuel' : ''}`}
                    style={{ width: `${vehicle.fuel}%` }}
                  ></div>
                </div>
                <span className="fuel-percentage">{vehicle.fuel}%</span>
              </div>
            ) : (
              <div className="fuel-type">
                <span className="fuel-label">Fuel Type</span>
                <span className="fuel-value">{vehicle.fuel}</span>
              </div>
            )}
            
            {isFuelPercentage && vehicle.fuel <= 15 && (
              <div className="low-fuel-warning">
                <span className="warning-icon">!</span> Low fuel
              </div>
            )}
            
            {vehicle.number_plate && (
              <div className="number-plate">
                <span className="number-plate-label">Plate</span>
                <span className="number-plate-value">{vehicle.number_plate}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  )
}

export default VehicleList 