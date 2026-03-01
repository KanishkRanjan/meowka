import './LoadingScreen.css';

const LoadingScreen = () => {
  return (
    <div className="loading-screen-wrapper">
      <div className="loading-card">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-core"></div>
        </div>
        <div className="loading-text">
          <span className="text-primary">Gathering Fleet Data</span>
          <span className="text-secondary">Connecting to secure terminal</span>
        </div>
        <div className="loading-progress">
          <div className="progress-bar"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
