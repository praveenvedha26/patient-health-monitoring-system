import React, { useState, useEffect } from 'react';
import { database } from '../../config/firebase';
import { ref, onValue } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';
import { FaThermometerHalf, FaHeartbeat, FaLungs } from 'react-icons/fa';
import './Dashboard.css';

const PatientDashboard = () => {
  const { currentUser } = useAuth();
  const [healthData, setHealthData] = useState({
    temperature: 0,
    heartRate: 0,
    spo2: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      setErrorMessage('No user logged in');
      return;
    }

    const path = `patients/${currentUser.uid}/current`;
    
    try {
      const healthRef = ref(database, path);
      
      const unsubscribe = onValue(
        healthRef, 
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            
            setHealthData({
              temperature: Number(data.temperature) || 0,
              heartRate: Number(data.heartRate) || 0,
              spo2: Number(data.spo2) || 0
            });
            setLastUpdate(new Date());
            setIsLoading(false);
            setErrorMessage('');
          } else {
            setIsLoading(false);
            setErrorMessage('No health data available');
          }
        }, 
        (error) => {
          console.error('Firebase error:', error);
          setIsLoading(false);
          setErrorMessage(`Error: ${error.message}`);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Exception:', error);
      setIsLoading(false);
      setErrorMessage(`Exception: ${error.message}`);
    }
  }, [currentUser?.uid]);

  const getStatusColor = (type, value) => {
    if (type === 'temperature') {
      return value >= 36.1 && value <= 37.2 ? '#10b981' : '#ef4444';
    } else if (type === 'heartRate') {
      return value >= 60 && value <= 100 ? '#10b981' : '#ef4444';
    } else if (type === 'spo2') {
      return value >= 95 ? '#10b981' : '#ef4444';
    }
    return '#94a3b8';
  };

  const getStatusText = (type, value) => {
    if (type === 'temperature') {
      return value >= 36.1 && value <= 37.2 ? 'Normal' : value > 37.2 ? 'High' : 'Low';
    } else if (type === 'heartRate') {
      return value >= 60 && value <= 100 ? 'Normal' : value > 100 ? 'High' : 'Low';
    } else if (type === 'spo2') {
      return value >= 95 ? 'Good' : 'Low';
    }
    return 'Unknown';
  };

  if (!currentUser) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <h2>Please log in to view your dashboard</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Page Header */}
      <div className="dashboard-header">
        <h1>Patient Health Monitoring Dashboard</h1>
        <p>Real-time health parameter monitoring</p>
        {lastUpdate && (
          <p className="last-update">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your health data...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && errorMessage && (
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>No Data Available</h3>
          <p>{errorMessage}</p>
          <div className="error-help">
            <p><strong>Please check:</strong></p>
            <ul>
              <li>Your ESP32 device is connected and sending data</li>
              <li>Data exists in Firebase at: <code>patients/{currentUser.uid}/current</code></li>
              <li>Firebase security rules allow read access</li>
            </ul>
          </div>
        </div>
      )}

      {/* Health Cards - Only show when data is available */}
      {!isLoading && !errorMessage && (
        <>
          <div className="health-cards-grid">
            {/* Temperature Card */}
            <div className="health-card temperature-card">
              <div className="card-header">
                <div className="card-icon temperature-icon">
                  <FaThermometerHalf size={28} />
                </div>
                <div className="card-title">
                  <h3>Body Temperature</h3>
                  <span className={`status-badge ${getStatusText('temperature', healthData.temperature).toLowerCase()}`}>
                    {getStatusText('temperature', healthData.temperature)}
                  </span>
                </div>
              </div>
              <div className="card-body">
                <div className="card-value">
                  <span 
                    className="value-number" 
                    style={{ color: getStatusColor('temperature', healthData.temperature) }}
                  >
                    {healthData.temperature.toFixed(1)}
                  </span>
                  <span className="value-unit">°C</span>
                </div>
                <div className="card-range">
                  Normal range: 36.1 - 37.2°C
                </div>
              </div>
            </div>

            {/* Heart Rate Card */}
            <div className="health-card heartrate-card">
              <div className="card-header">
                <div className="card-icon heartrate-icon">
                  <FaHeartbeat size={28} />
                </div>
                <div className="card-title">
                  <h3>Heart Rate</h3>
                  <span className={`status-badge ${getStatusText('heartRate', healthData.heartRate).toLowerCase()}`}>
                    {getStatusText('heartRate', healthData.heartRate)}
                  </span>
                </div>
              </div>
              <div className="card-body">
                <div className="card-value">
                  <span 
                    className="value-number" 
                    style={{ color: getStatusColor('heartRate', healthData.heartRate) }}
                  >
                    {healthData.heartRate}
                  </span>
                  <span className="value-unit">bpm</span>
                </div>
                <div className="card-range">
                  Normal range: 60 - 100 bpm
                </div>
              </div>
            </div>

            {/* SpO2 Card */}
            <div className="health-card spo2-card">
              <div className="card-header">
                <div className="card-icon spo2-icon">
                  <FaLungs size={28} />
                </div>
                <div className="card-title">
                  <h3>Oxygen Saturation</h3>
                  <span className={`status-badge ${getStatusText('spo2', healthData.spo2).toLowerCase()}`}>
                    {getStatusText('spo2', healthData.spo2)}
                  </span>
                </div>
              </div>
              <div className="card-body">
                <div className="card-value">
                  <span 
                    className="value-number" 
                    style={{ color: getStatusColor('spo2', healthData.spo2) }}
                  >
                    {healthData.spo2}
                  </span>
                  <span className="value-unit">%</span>
                </div>
                <div className="card-range">
                  Normal range: ≥ 95%
                </div>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="info-banner">
            <div className="banner-icon">📊</div>
            <p>Data updates automatically from your ESP32 device in real-time</p>
          </div>
        </>
      )}
    </div>
  );
};

export default PatientDashboard;
