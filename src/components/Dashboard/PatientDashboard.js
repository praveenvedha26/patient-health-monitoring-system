import React, { useState, useEffect } from 'react';
import { firestore } from '../../config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
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
  const [patientInfo, setPatientInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      setErrorMessage('No user logged in');
      return;
    }

    // Listen to real-time updates from Firestore patients collection
    const patientRef = doc(firestore, 'patients', currentUser.uid);
    
    const unsubscribe = onSnapshot(
      patientRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          
          // Set patient info
          setPatientInfo({
            name: data.name,
            age: data.age,
            email: data.email
          });

          // Set vital signs if they exist
          if (data.vitalSigns) {
            setHealthData({
              temperature: Number(data.vitalSigns.temperature) || 0,
              heartRate: Number(data.vitalSigns.heartRate) || 0,
              spo2: Number(data.vitalSigns.spO2) || 0
            });
            setLastUpdate(new Date(data.vitalSigns.lastUpdated));
          } else {
            setHealthData({
              temperature: 0,
              heartRate: 0,
              spo2: 0
            });
          }
          
          setIsLoading(false);
          setErrorMessage('');
        } else {
          setIsLoading(false);
          setErrorMessage('No patient data found. Please contact your administrator.');
        }
      },
      (error) => {
        console.error('Firestore error:', error);
        setIsLoading(false);
        setErrorMessage(`Error: ${error.message}`);
      }
    );

    return () => unsubscribe();
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
        <div className="error-container">
          <div className="error-icon">🔒</div>
          <h3>Authentication Required</h3>
          <p>Please log in to view your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Page Header */}
      <div className="dashboard-header">
        <h1>Patient Health Monitoring Dashboard</h1>
        {patientInfo && (
          <p>Welcome, {patientInfo.name} | Age: {patientInfo.age}</p>
        )}
        {lastUpdate && (
          <p className="last-update">
            Last updated: {lastUpdate.toLocaleString()}
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
            <p><strong>Possible reasons:</strong></p>
            <ul>
              <li>Your patient profile hasn't been created by an administrator</li>
              <li>Your vital signs haven't been recorded yet</li>
              <li>Contact your healthcare provider for assistance</li>
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
            <p>
              {healthData.temperature > 0 || healthData.heartRate > 0 || healthData.spo2 > 0
                ? 'Your vital signs are being monitored. Data updates automatically.'
                : 'Waiting for vital signs data. Please consult with your healthcare provider.'}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default PatientDashboard;
