import React, { useState, useEffect } from 'react';
import { database } from '../../config/firebase';
import { ref, onValue } from 'firebase/database';
import { FaThermometerHalf, FaHeartbeat, FaLungs, FaUser } from 'react-icons/fa';
import './Dashboard.css';

const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    const patientsRef = ref(database, 'patients');
    
    const unsubscribe = onValue(patientsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const patientsList = Object.keys(data).map(patientId => ({
          id: patientId,
          ...data[patientId].current,
          name: data[patientId].name || `Patient ${patientId.substring(0, 6)}`
        }));
        setPatients(patientsList);
        if (patientsList.length > 0 && !selectedPatient) {
          setSelectedPatient(patientsList[0]);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      const patientRef = ref(database, `patients/${selectedPatient.id}/current`);
      
      const unsubscribe = onValue(patientRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setSelectedPatient(prev => ({
            ...prev,
            ...data
          }));
        }
      });

      return () => unsubscribe();
    }
  }, [selectedPatient?.id]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Doctor Dashboard - All Patients</h1>
        <p>Monitor multiple patients in real-time</p>
      </div>

      <div className="doctor-layout">
        <div className="patients-sidebar">
          <h3><FaUser /> Patients List</h3>
          <div className="patients-list">
            {patients.map(patient => (
              <div 
                key={patient.id}
                className={`patient-item ${selectedPatient?.id === patient.id ? 'active' : ''}`}
                onClick={() => setSelectedPatient(patient)}
              >
                <div className="patient-avatar">{patient.name.charAt(0)}</div>
                <div className="patient-info">
                  <p className="patient-name">{patient.name}</p>
                  <p className="patient-id">ID: {patient.id.substring(0, 8)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="patient-details">
          {selectedPatient && (
            <>
              <div className="patient-header">
                <h2>{selectedPatient.name}</h2>
                <span className="patient-status">🟢 Active</span>
              </div>

              <div className="health-cards">
                <div className="health-card">
                  <div className="card-icon" style={{ background: '#fef3c7' }}>
                    <FaThermometerHalf color="#f59e0b" size={28} />
                  </div>
                  <div className="card-content">
                    <h3>Temperature</h3>
                    <div className="card-value">
                      <span className="value">{selectedPatient.temperature?.toFixed(1) || 0}</span>
                      <span className="unit">°C</span>
                    </div>
                  </div>
                </div>

                <div className="health-card">
                  <div className="card-icon" style={{ background: '#fecdd3' }}>
                    <FaHeartbeat color="#e11d48" size={28} />
                  </div>
                  <div className="card-content">
                    <h3>Heart Rate</h3>
                    <div className="card-value">
                      <span className="value">{selectedPatient.heartRate || 0}</span>
                      <span className="unit">BPM</span>
                    </div>
                  </div>
                </div>

                <div className="health-card">
                  <div className="card-icon" style={{ background: '#dbeafe' }}>
                    <FaLungs color="#3b82f6" size={28} />
                  </div>
                  <div className="card-content">
                    <h3>SpO₂</h3>
                    <div className="card-value">
                      <span className="value">{selectedPatient.spo2 || 0}</span>
                      <span className="unit">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
