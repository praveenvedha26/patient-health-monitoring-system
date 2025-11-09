import React, { useState, useEffect, useCallback } from 'react';
import { firestore } from '../../config/firebase';
import { collection, getDocs, doc, updateDoc, getDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import { FaUserMd, FaUserInjured, FaPlus, FaTrash, FaHeartbeat, FaThermometerHalf, FaLungs, FaEdit, FaUserPlus } from 'react-icons/fa';
import './Dashboard.css';

const DoctorDashboard = () => {
  const { currentUser } = useAuth();
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [myPatients, setMyPatients] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [availablePatients, setAvailablePatients] = useState([]);
  const [showAssignPatient, setShowAssignPatient] = useState(false);
  const [showAddNewPatient, setShowAddNewPatient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addPatientLoading, setAddPatientLoading] = useState(false);

  // New patient form state
  const [newPatient, setNewPatient] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    heartRate: '',
    spO2: '',
    temperature: ''
  });

  // Use useCallback to memoize functions
  const fetchDoctorInfo = useCallback(async () => {
    if (!currentUser?.uid) return;
    
    try {
      const doctorDoc = await getDoc(doc(firestore, 'doctors', currentUser.uid));
      if (doctorDoc.exists()) {
        const data = doctorDoc.data();
        setDoctorInfo(data);
        
        // Fetch patient details for patients assigned to this doctor
        if (data.patients && data.patients.length > 0) {
          const patientPromises = data.patients.map(patientId =>
            getDoc(doc(firestore, 'patients', patientId))
          );
          const patientDocs = await Promise.all(patientPromises);
          const patients = patientDocs
            .filter(doc => doc.exists())
            .map(doc => ({ id: doc.id, ...doc.data() }));
          setMyPatients(patients);
        } else {
          setMyPatients([]);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching doctor info:', error);
      setLoading(false);
    }
  }, [currentUser?.uid]);

  const fetchAllPatients = useCallback(async () => {
    try {
      const patientsCollection = collection(firestore, 'patients');
      const patientsSnapshot = await getDocs(patientsCollection);
      const patientsList = patientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllPatients(patientsList);
    } catch (error) {
      console.error('Error fetching all patients:', error);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchDoctorInfo();
      fetchAllPatients();
    }
  }, [currentUser?.uid, fetchDoctorInfo, fetchAllPatients]);

  // Filter patients who are NOT assigned to this doctor
  useEffect(() => {
    if (doctorInfo && allPatients.length > 0) {
      const myPatientIds = doctorInfo.patients || [];
      const available = allPatients.filter(
        patient => !myPatientIds.includes(patient.id)
      );
      setAvailablePatients(available);
    }
  }, [doctorInfo, allPatients]);

  // Generate dummy vital signs
  const generateDummyVitals = () => {
    return {
      heartRate: Math.floor(Math.random() * (100 - 60 + 1)) + 60,
      spO2: Math.floor(Math.random() * (100 - 95 + 1)) + 95,
      temperature: (Math.random() * (37.5 - 36.5) + 36.5).toFixed(1)
    };
  };

  const fillDummyPatientData = () => {
    const vitals = generateDummyVitals();
    setNewPatient({
      ...newPatient,
      age: Math.floor(Math.random() * (80 - 18 + 1)) + 18,
      heartRate: vitals.heartRate,
      spO2: vitals.spO2,
      temperature: vitals.temperature
    });
  };

  // Add new patient (create account)
  const handleAddNewPatient = async (e) => {
    e.preventDefault();
    
    if (!newPatient.name || !newPatient.email || !newPatient.password || !newPatient.age) {
      alert('❌ Please fill in all required fields.');
      return;
    }

    if (newPatient.password.length < 6) {
      alert('❌ Password must be at least 6 characters long.');
      return;
    }

    setAddPatientLoading(true);

    try {
      const auth = getAuth();
      
      // Create authentication account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newPatient.email,
        newPatient.password
      );

      const userId = userCredential.user.uid;

      // Add to users collection
      await setDoc(doc(firestore, 'users', userId), {
        uid: userId,
        fullName: newPatient.name,
        email: newPatient.email,
        role: 'patient',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Add to patients collection with health data and assign to current doctor
      await setDoc(doc(firestore, 'patients', userId), {
        userId: userId,
        name: newPatient.name,
        email: newPatient.email,
        age: parseInt(newPatient.age),
        dateOfBirth: null,
        gender: null,
        bloodType: null,
        allergies: [],
        emergencyContact: {},
        assignedDoctorId: currentUser.uid, // Auto-assign to this doctor
        vitalSigns: {
          heartRate: parseInt(newPatient.heartRate) || 0,
          spO2: parseInt(newPatient.spO2) || 0,
          temperature: parseFloat(newPatient.temperature) || 0,
          lastUpdated: new Date().toISOString()
        },
        createdAt: new Date().toISOString()
      });

      // Update doctor's patients array
      await updateDoc(doc(firestore, 'doctors', currentUser.uid), {
        patients: arrayUnion(userId)
      });

      // Reset form
      setNewPatient({
        name: '',
        email: '',
        password: '',
        age: '',
        heartRate: '',
        spO2: '',
        temperature: ''
      });

      await fetchDoctorInfo();
      await fetchAllPatients();
      alert('✅ Patient created and added to your care successfully!');
      setShowAddNewPatient(false);
    } catch (error) {
      console.error('Error adding patient:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        alert('❌ Error: This email is already registered.\n\nPlease use a different email address.');
      } else if (error.code === 'auth/invalid-email') {
        alert('❌ Error: Invalid email address format.');
      } else if (error.code === 'auth/weak-password') {
        alert('❌ Error: Password is too weak.\nPassword must be at least 6 characters long.');
      } else {
        alert(`❌ Error adding patient:\n\n${error.message}`);
      }
    } finally {
      setAddPatientLoading(false);
    }
  };

  // Assign existing patient to this doctor
  const handleAssignExistingPatient = async (patientId) => {
    try {
      // Update doctor's patients array
      await updateDoc(doc(firestore, 'doctors', currentUser.uid), {
        patients: arrayUnion(patientId)
      });

      // Update patient's assignedDoctorId
      await updateDoc(doc(firestore, 'patients', patientId), {
        assignedDoctorId: currentUser.uid
      });

      await fetchDoctorInfo();
      await fetchAllPatients();
      alert('✅ Patient assigned to your care successfully!');
      setShowAssignPatient(false);
    } catch (error) {
      console.error('Error assigning patient:', error);
      alert('❌ Error assigning patient: ' + error.message);
    }
  };

  const handleRemovePatient = async (patientId) => {
    if (window.confirm('⚠️ Are you sure you want to remove this patient from your care?')) {
      try {
        // Remove patient from doctor's patients array
        await updateDoc(doc(firestore, 'doctors', currentUser.uid), {
          patients: arrayRemove(patientId)
        });

        // Update patient's assignedDoctorId to null
        await updateDoc(doc(firestore, 'patients', patientId), {
          assignedDoctorId: null
        });

        await fetchDoctorInfo();
        await fetchAllPatients();
        alert('✅ Patient removed from your care successfully!');
      } catch (error) {
        console.error('Error removing patient:', error);
        alert('❌ Error removing patient: ' + error.message);
      }
    }
  };

  const getVitalStatus = (type, value) => {
    if (type === 'temperature') {
      return value >= 36.1 && value <= 37.2 ? 'Normal' : value > 37.2 ? 'High' : 'Low';
    } else if (type === 'heartRate') {
      return value >= 60 && value <= 100 ? 'Normal' : value > 100 ? 'High' : 'Low';
    } else if (type === 'spo2') {
      return value >= 95 ? 'Good' : 'Low';
    }
    return 'Unknown';
  };

  const getVitalColor = (type, value) => {
    const status = getVitalStatus(type, value);
    return status === 'Normal' || status === 'Good' ? '#10b981' : '#ef4444';
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading doctor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1><FaUserMd /> Doctor Dashboard</h1>
        {doctorInfo && (
          <div>
            <p>Welcome, Dr. {doctorInfo.name}</p>
            <p className="text-sm text-gray-600">
              {doctorInfo.specialization} | {doctorInfo.department}
            </p>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="stats-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Patients</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '8px' }}>{myPatients.length}</div>
        </div>
        
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Specialization</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '8px' }}>{doctorInfo?.specialization || 'N/A'}</div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Department</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '8px' }}>{doctorInfo?.department || 'N/A'}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            setShowAddNewPatient(!showAddNewPatient);
            setShowAssignPatient(false);
          }}
          className="add-button"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <FaUserPlus /> {showAddNewPatient ? 'Cancel' : 'Add New Patient'}
        </button>

        <button
          onClick={() => {
            setShowAssignPatient(!showAssignPatient);
            setShowAddNewPatient(false);
          }}
          className="add-button"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
          }}
        >
          <FaEdit /> {showAssignPatient ? 'Cancel' : 'Assign Existing Patient'}
        </button>
      </div>

      {/* Add New Patient Form */}
      {showAddNewPatient && (
        <div className="add-user-section" style={{ marginBottom: '30px' }}>
          <h2><FaUserPlus /> Create New Patient Account</h2>
          <form onSubmit={handleAddNewPatient} className="user-form">
            <div className="form-row">
              <input
                type="text"
                placeholder="Full Name *"
                value={newPatient.name}
                onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                required
              />
              <input
                type="email"
                placeholder="Email *"
                value={newPatient.email}
                onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                required
              />
            </div>
            <div className="form-row">
              <input
                type="password"
                placeholder="Password (min 6 characters) *"
                value={newPatient.password}
                onChange={(e) => setNewPatient({...newPatient, password: e.target.value})}
                required
                minLength="6"
              />
              <input
                type="number"
                placeholder="Age *"
                value={newPatient.age}
                onChange={(e) => setNewPatient({...newPatient, age: e.target.value})}
                required
                min="1"
                max="150"
              />
            </div>
            <div className="vitals-section">
              <h3><FaHeartbeat /> Vital Signs (Optional)</h3>
              <div className="form-row">
                <input
                  type="number"
                  placeholder="Heart Rate (bpm)"
                  value={newPatient.heartRate}
                  onChange={(e) => setNewPatient({...newPatient, heartRate: e.target.value})}
                  min="0"
                  max="300"
                />
                <input
                  type="number"
                  placeholder="SpO2 (%)"
                  value={newPatient.spO2}
                  onChange={(e) => setNewPatient({...newPatient, spO2: e.target.value})}
                  min="0"
                  max="100"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Temperature (°C)"
                  value={newPatient.temperature}
                  onChange={(e) => setNewPatient({...newPatient, temperature: e.target.value})}
                  min="30"
                  max="45"
                />
              </div>
              <button 
                type="button" 
                onClick={fillDummyPatientData}
                className="dummy-button"
              >
                Fill Dummy Data
              </button>
            </div>
            <button type="submit" disabled={addPatientLoading} className="add-button">
              {addPatientLoading ? 'Creating Patient...' : 'Create & Add Patient'}
            </button>
          </form>
        </div>
      )}

      {/* Assign Existing Patient Section */}
      {showAssignPatient && (
        <div className="add-user-section" style={{ marginBottom: '30px' }}>
          <h2><FaEdit /> Assign Existing Patient to Your Care</h2>
          <div className="users-table">
            {availablePatients.length === 0 ? (
              <p className="no-data">All patients are already assigned to doctors or you have all patients.</p>
            ) : (
              availablePatients.map(patient => (
                <div key={patient.id} className="user-row patient-row">
                  <div className="user-icon"><FaUserInjured color="#10b981" size={28} /></div>
                  <div className="user-details">
                    <h4>{patient.name}</h4>
                    <p>{patient.email}</p>
                    <div className="patient-info">
                      <span className="info-badge">Age: {patient.age}</span>
                      {patient.vitalSigns && (
                        <>
                          <span className="info-badge">❤️ {patient.vitalSigns.heartRate} bpm</span>
                          <span className="info-badge">🫁 {patient.vitalSigns.spO2}%</span>
                          <span className="info-badge">🌡️ {patient.vitalSigns.temperature}°C</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAssignExistingPatient(patient.id)}
                    className="add-button"
                    style={{ padding: '10px 20px' }}
                  >
                    <FaPlus /> Assign to Me
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* My Patients Section */}
      <div className="users-list-section">
        <h2><FaUserInjured /> My Patients ({myPatients.length})</h2>
        <div className="patients-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px', marginTop: '24px' }}>
          {myPatients.length === 0 ? (
            <p className="no-data" style={{ gridColumn: '1 / -1' }}>
              No patients under your care yet. Create a new patient or assign an existing one.
            </p>
          ) : (
            myPatients.map(patient => (
              <div key={patient.id} className="patient-card" style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '2px solid #e5e7eb',
                transition: 'all 0.3s ease'
              }}>
                {/* Patient Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '2px solid #f3f4f6' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FaUserInjured color="#10b981" size={28} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1f2937' }}>{patient.name}</h3>
                    <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>{patient.email}</p>
                    <span className="info-badge" style={{ marginTop: '8px', display: 'inline-block' }}>Age: {patient.age}</span>
                  </div>
                </div>

                {/* Vital Signs */}
                {patient.vitalSigns && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '12px', fontWeight: 600 }}>VITAL SIGNS</h4>
                    
                    {/* Temperature */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '12px', background: '#fef3c7', borderRadius: '8px' }}>
                      <FaThermometerHalf color="#f59e0b" size={24} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', color: '#92400e' }}>Temperature</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getVitalColor('temperature', patient.vitalSigns.temperature) }}>
                          {patient.vitalSigns.temperature}°C
                        </div>
                      </div>
                      <span className={`status-badge ${getVitalStatus('temperature', patient.vitalSigns.temperature).toLowerCase()}`}>
                        {getVitalStatus('temperature', patient.vitalSigns.temperature)}
                      </span>
                    </div>

                    {/* Heart Rate */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '12px', background: '#fecdd3', borderRadius: '8px' }}>
                      <FaHeartbeat color="#e11d48" size={24} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', color: '#881337' }}>Heart Rate</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getVitalColor('heartRate', patient.vitalSigns.heartRate) }}>
                          {patient.vitalSigns.heartRate} bpm
                        </div>
                      </div>
                      <span className={`status-badge ${getVitalStatus('heartRate', patient.vitalSigns.heartRate).toLowerCase()}`}>
                        {getVitalStatus('heartRate', patient.vitalSigns.heartRate)}
                      </span>
                    </div>

                    {/* SpO2 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#dbeafe', borderRadius: '8px' }}>
                      <FaLungs color="#3b82f6" size={24} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', color: '#1e40af' }}>Oxygen Saturation</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getVitalColor('spo2', patient.vitalSigns.spO2) }}>
                          {patient.vitalSigns.spO2}%
                        </div>
                      </div>
                      <span className={`status-badge ${getVitalStatus('spo2', patient.vitalSigns.spO2).toLowerCase()}`}>
                        {getVitalStatus('spo2', patient.vitalSigns.spO2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Last Updated */}
                {patient.vitalSigns?.lastUpdated && (
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '16px' }}>
                    Last updated: {new Date(patient.vitalSigns.lastUpdated).toLocaleString()}
                  </div>
                )}

                {/* Remove Button */}
                <button
                  onClick={() => handleRemovePatient(patient.id)}
                  className="delete-button"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <FaTrash /> Remove from My Care
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
