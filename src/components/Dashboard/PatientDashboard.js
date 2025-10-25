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

  useEffect(() => {
    console.log('====================================');
    console.log('PATIENT DASHBOARD - useEffect triggered');
    console.log('Current User:', currentUser);
    console.log('User Email:', currentUser?.email);
    console.log('User UID:', currentUser?.uid);
    console.log('====================================');

    if (!currentUser?.uid) {
      console.log('❌ No user UID found');
      setIsLoading(false);
      setErrorMessage('No user logged in');
      return;
    }

    const path = `patients/${currentUser.uid}/current`;
    console.log('📍 Firebase path:', path);
    console.log('🔥 Creating Firebase reference...');

    try {
      const healthRef = ref(database, path);
      console.log('✅ Firebase reference created successfully');
      
      console.log('👂 Setting up listener...');
      const unsubscribe = onValue(
        healthRef, 
        (snapshot) => {
          console.log('====================================');
          console.log('📦 SNAPSHOT RECEIVED');
          console.log('Snapshot exists?', snapshot.exists());
          console.log('Snapshot value:', snapshot.val());
          console.log('====================================');
          
          if (snapshot.exists()) {
            const data = snapshot.val();
            console.log('✅ DATA FOUND:', data);
            console.log('Temperature:', data.temperature);
            console.log('Heart Rate:', data.heartRate);
            console.log('SpO2:', data.spo2);
            
            const newHealthData = {
              temperature: Number(data.temperature) || 0,
              heartRate: Number(data.heartRate) || 0,
              spo2: Number(data.spo2) || 0
            };
            
            console.log('Setting health data to:', newHealthData);
            setHealthData(newHealthData);
            setIsLoading(false);
            setErrorMessage('');
          } else {
            console.log('❌ NO DATA FOUND at path:', path);
            setIsLoading(false);
            setErrorMessage(`No data found at: ${path}`);
          }
        }, 
        (error) => {
          console.error('====================================');
          console.error('❌ FIREBASE ERROR');
          console.error('Error:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          console.error('====================================');
          setIsLoading(false);
          setErrorMessage(`Firebase error: ${error.message}`);
        }
      );

      console.log('✅ Listener attached successfully');

      return () => {
        console.log('🔌 Cleaning up Firebase listener');
        unsubscribe();
      };
    } catch (error) {
      console.error('====================================');
      console.error('❌ EXCEPTION IN useEffect');
      console.error('Error:', error);
      console.error('====================================');
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

  console.log('🎨 RENDERING DASHBOARD');
  console.log('Health Data:', healthData);
  console.log('Is Loading:', isLoading);
  console.log('Error Message:', errorMessage);

  if (!currentUser) {
    return (
      <div className="dashboard-container">
        <h2>Please log in to view your dashboard</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Debug Info Box */}
      <div style={{
        background: '#fff3cd',
        border: '3px solid #ffc107',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px',
        fontFamily: 'monospace'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#856404' }}>🔍 Debug Information</h3>
        <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
          <p><strong>Logged in as:</strong> {currentUser?.email}</p>
          <p><strong>User UID:</strong> {currentUser?.uid}</p>
          <p><strong>Database Path:</strong> patients/{currentUser?.uid}/current</p>
          <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
          <p><strong>Error:</strong> {errorMessage || 'None'}</p>
          <p><strong>Temperature:</strong> {healthData.temperature}</p>
          <p><strong>Heart Rate:</strong> {healthData.heartRate}</p>
          <p><strong>SpO2:</strong> {healthData.spo2}</p>
          <hr style={{ margin: '15px 0' }} />
          <p style={{ color: '#856404', fontSize: '12px' }}>
            ⚠️ Open browser console (F12) to see detailed logs!
          </p>
        </div>
      </div>

      <div className="dashboard-header">
        <h1>Patient Health Monitoring Dashboard</h1>
        <p>Real-time health parameter monitoring</p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px', fontSize: '20px' }}>
          <p>⏳ Loading health data...</p>
        </div>
      ) : errorMessage ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '50px', 
          background: '#fee2e2',
          borderRadius: '10px',
          color: '#991b1b'
        }}>
          <h3>❌ Error Loading Data</h3>
          <p>{errorMessage}</p>
          <p style={{ fontSize: '14px', marginTop: '20px' }}>
            Please check:
            <br />1. You have data in Firebase at the correct path
            <br />2. Firebase rules allow read access
            <br />3. Your UID matches the data in Firebase
          </p>
        </div>
      ) : (
        <div className="health-cards">
          <div className="health-card">
            <div className="card-icon" style={{ background: '#fef3c7' }}>
              <FaThermometerHalf color="#f59e0b" size={32} />
            </div>
            <div className="card-content">
              <h3>Body Temperature</h3>
              <div className="card-value">
                <span 
                  className="value" 
                  style={{ color: getStatusColor('temperature', healthData.temperature) }}
                >
                  {healthData.temperature.toFixed(1)}
                </span>
                <span className="unit">°C</span>
              </div>
              <p className="card-label">Normal: 36.1 - 37.2°C</p>
            </div>
          </div>

          <div className="health-card">
            <div className="card-icon" style={{ background: '#fecdd3' }}>
              <FaHeartbeat color="#e11d48" size={32} />
            </div>
            <div className="card-content">
              <h3>Heart Rate</h3>
              <div className="card-value">
                <span 
                  className="value" 
                  style={{ color: getStatusColor('heartRate', healthData.heartRate) }}
                >
                  {healthData.heartRate}
                </span>
                <span className="unit">BPM</span>
              </div>
              <p className="card-label">Normal: 60 - 100 BPM</p>
            </div>
          </div>

          <div className="health-card">
            <div className="card-icon" style={{ background: '#dbeafe' }}>
              <FaLungs color="#3b82f6" size={32} />
            </div>
            <div className="card-content">
              <h3>SpO₂ Level</h3>
              <div className="card-value">
                <span 
                  className="value" 
                  style={{ color: getStatusColor('spo2', healthData.spo2) }}
                >
                  {healthData.spo2}
                </span>
                <span className="unit">%</span>
              </div>
              <p className="card-label">Normal: ≥ 95%</p>
            </div>
          </div>
        </div>
      )}

      <div className="info-banner">
        <p>📊 Data updates automatically from your ESP32 device</p>
      </div>
    </div>
  );
};

export default PatientDashboard;
