import React, { useState, useEffect } from 'react';
import { database, firestore } from '../../config/firebase';
import { ref, query, orderByChild, limitToLast, onValue } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import './HealthHistory.css';

const HealthHistory = () => {
  const { currentUser, userRole } = useAuth();
  const [history, setHistory] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    if (userRole === 'doctor') {
      fetchPatients();
    } else if (userRole === 'patient') {
      fetchPatientHistory(currentUser.uid);
    }
  }, [userRole, currentUser.uid]);

  const fetchPatients = async () => {
    const patientsRef = ref(database, 'patients');
    onValue(patientsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const patientsList = Object.keys(data).map(id => ({
          id,
          name: data[id].name || `Patient ${id.substring(0, 6)}`
        }));
        setPatients(patientsList);
        if (patientsList.length > 0) {
          setSelectedPatient(patientsList[0].id);
          fetchPatientHistory(patientsList[0].id);
        }
      }
    });
  };

  const fetchPatientHistory = (patientId) => {
    const historyRef = query(
      ref(database, `patients/${patientId}/history`),
      orderByChild('timestamp'),
      limitToLast(50)
    );

    onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const historyList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).reverse();
        setHistory(historyList);
      } else {
        setHistory([]);
      }
    });
  };

  const handlePatientChange = (patientId) => {
    setSelectedPatient(patientId);
    fetchPatientHistory(patientId);
  };

  const filteredHistory = filterDate
    ? history.filter(record => {
        const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
        return recordDate === filterDate;
      })
    : history;

  return (
    <div className="history-container">
      <div className="history-header">
        <h1>📜 Patient Health History</h1>
        <p>View historical health data and trends</p>
      </div>

      {userRole === 'doctor' && (
        <div className="patient-selector">
          <label>Select Patient:</label>
          <select onChange={(e) => handlePatientChange(e.target.value)} value={selectedPatient || ''}>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="filter-section">
        <label>Filter by Date:</label>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        {filterDate && (
          <button onClick={() => setFilterDate('')} className="clear-filter">
            Clear Filter
          </button>
        )}
      </div>

      <div className="history-table">
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Temperature (°C)</th>
              <th>Heart Rate (BPM)</th>
              <th>SpO₂ (%)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length > 0 ? (
              filteredHistory.map(record => (
                <tr key={record.id}>
                  <td>{new Date(record.timestamp).toLocaleString()}</td>
                  <td>{record.temperature?.toFixed(1) || 'N/A'}</td>
                  <td>{record.heartRate || 'N/A'}</td>
                  <td>{record.spo2 || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${record.status || 'normal'}`}>
                      {record.status || 'Normal'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">No health history available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HealthHistory;
