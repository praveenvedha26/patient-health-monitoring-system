import React, { useState, useEffect } from 'react';
import { firestore } from '../../config/firebase';
import { collection, getDocs, deleteDoc, doc, setDoc, query, where, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { FaUserPlus, FaTrash, FaUserMd, FaUserInjured, FaUserShield, FaHeartbeat } from 'react-icons/fa';
import './Dashboard.css';

const AdminDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [activeTab, setActiveTab] = useState('patients');
  
  const [newPatient, setNewPatient] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    heartRate: '',
    spO2: '',
    temperature: ''
  });

  const [newDoctor, setNewDoctor] = useState({
    name: '',
    email: '',
    password: '',
    specialization: '',
    licenseNumber: '',
    department: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
  }, []);

  const fetchPatients = async () => {
    try {
      const patientsCollection = collection(firestore, 'patients');
      const patientsSnapshot = await getDocs(patientsCollection);
      const patientsList = patientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPatients(patientsList);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const doctorsCollection = collection(firestore, 'doctors');
      const doctorsSnapshot = await getDocs(doctorsCollection);
      const doctorsList = doctorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDoctors(doctorsList);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const generateDummyVitals = () => {
    return {
      heartRate: Math.floor(Math.random() * (100 - 60 + 1)) + 60,
      spO2: Math.floor(Math.random() * (100 - 95 + 1)) + 95,
      temperature: (Math.random() * (37.5 - 36.5) + 36.5).toFixed(1)
    };
  };

  const checkEmailExists = async (email) => {
    try {
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    
    if (!newPatient.name || !newPatient.email || !newPatient.password || !newPatient.age) {
      alert('❌ Please fill in all required fields.');
      return;
    }

    if (newPatient.password.length < 6) {
      alert('❌ Password must be at least 6 characters long.');
      return;
    }

    const emailExists = await checkEmailExists(newPatient.email);
    if (emailExists) {
      alert('❌ This email is already registered.\n\nPlease use a different email address or delete the existing user first.');
      return;
    }

    setLoading(true);

    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newPatient.email,
        newPatient.password
      );

      const userId = userCredential.user.uid;

      await setDoc(doc(firestore, 'users', userId), {
        uid: userId,
        fullName: newPatient.name,
        email: newPatient.email,
        role: 'patient',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

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
        assignedDoctorId: null,
        vitalSigns: {
          heartRate: parseInt(newPatient.heartRate) || 0,
          spO2: parseInt(newPatient.spO2) || 0,
          temperature: parseFloat(newPatient.temperature) || 0,
          lastUpdated: new Date().toISOString()
        },
        createdAt: new Date().toISOString()
      });

      setNewPatient({
        name: '',
        email: '',
        password: '',
        age: '',
        heartRate: '',
        spO2: '',
        temperature: ''
      });

      await fetchPatients();
      alert('✅ Patient added successfully!');
    } catch (error) {
      console.error('Error adding patient:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        alert('❌ Error: This email is already registered in Firebase Authentication.\n\nPlease:\n1. Use a different email address, OR\n2. Delete the existing user from Firebase Console → Authentication');
      } else if (error.code === 'auth/invalid-email') {
        alert('❌ Error: Invalid email address format.');
      } else if (error.code === 'auth/weak-password') {
        alert('❌ Error: Password is too weak.\nPassword must be at least 6 characters long.');
      } else {
        alert(`❌ Error adding patient:\n\n${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    
    if (!newDoctor.name || !newDoctor.email || !newDoctor.password) {
      alert('❌ Please fill in all required fields.');
      return;
    }

    if (newDoctor.password.length < 6) {
      alert('❌ Password must be at least 6 characters long.');
      return;
    }

    const emailExists = await checkEmailExists(newDoctor.email);
    if (emailExists) {
      alert('❌ This email is already registered.\n\nPlease use a different email address or delete the existing user first.');
      return;
    }

    setLoading(true);

    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newDoctor.email,
        newDoctor.password
      );

      const userId = userCredential.user.uid;

      await setDoc(doc(firestore, 'users', userId), {
        uid: userId,
        fullName: newDoctor.name,
        email: newDoctor.email,
        role: 'doctor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      await setDoc(doc(firestore, 'doctors', userId), {
        userId: userId,
        name: newDoctor.name,
        email: newDoctor.email,
        specialization: newDoctor.specialization,
        licenseNumber: newDoctor.licenseNumber,
        department: newDoctor.department,
        patients: [],
        createdAt: new Date().toISOString()
      });

      setNewDoctor({
        name: '',
        email: '',
        password: '',
        specialization: '',
        licenseNumber: '',
        department: ''
      });

      await fetchDoctors();
      alert('✅ Doctor added successfully!');
    } catch (error) {
      console.error('Error adding doctor:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        alert('❌ Error: This email is already registered in Firebase Authentication.\n\nPlease:\n1. Use a different email address, OR\n2. Delete the existing user from Firebase Console → Authentication');
      } else if (error.code === 'auth/invalid-email') {
        alert('❌ Error: Invalid email address format.');
      } else if (error.code === 'auth/weak-password') {
        alert('❌ Error: Password is too weak.\nPassword must be at least 6 characters long.');
      } else {
        alert(`❌ Error adding doctor:\n\n${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatient = async (patientId) => {
    if (window.confirm('⚠️ Are you sure you want to delete this patient?\n\nThis will:\n- Delete their Firestore data\n- Remove their user account\n\nNote: You may need to manually delete from Firebase Authentication.')) {
      try {
        // Get patient data to check if assigned to a doctor
        const patientDoc = await getDocs(query(collection(firestore, 'patients'), where('userId', '==', patientId)));
        if (!patientDoc.empty) {
          const patientData = patientDoc.docs[0].data();
          
          // If patient is assigned to a doctor, remove from doctor's patients array
          if (patientData.assignedDoctorId) {
            await updateDoc(doc(firestore, 'doctors', patientData.assignedDoctorId), {
              patients: arrayRemove(patientId)
            });
          }
        }

        await deleteDoc(doc(firestore, 'patients', patientId));
        await deleteDoc(doc(firestore, 'users', patientId));
        
        await fetchPatients();
        await fetchDoctors();
        alert('✅ Patient deleted successfully!');
      } catch (error) {
        console.error('Error deleting patient:', error);
        alert(`❌ Error deleting patient:\n\n${error.message}`);
      }
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (window.confirm('⚠️ Are you sure you want to delete this doctor?\n\nThis will:\n- Delete their Firestore data\n- Unassign all their patients\n- Remove their user account')) {
      try {
        // Get doctor data to unassign patients
        const doctorDoc = await getDocs(query(collection(firestore, 'doctors'), where('userId', '==', doctorId)));
        if (!doctorDoc.empty) {
          const doctorData = doctorDoc.docs[0].data();
          
          // Unassign all patients
          if (doctorData.patients && doctorData.patients.length > 0) {
            for (const patientId of doctorData.patients) {
              await updateDoc(doc(firestore, 'patients', patientId), {
                assignedDoctorId: null
              });
            }
          }
        }

        await deleteDoc(doc(firestore, 'doctors', doctorId));
        await deleteDoc(doc(firestore, 'users', doctorId));
        
        await fetchDoctors();
        await fetchPatients();
        alert('✅ Doctor deleted and all patients unassigned successfully!');
      } catch (error) {
        console.error('Error deleting doctor:', error);
        alert(`❌ Error deleting doctor:\n\n${error.message}`);
      }
    }
  };

  // Assign/Reassign patient to a doctor
  const handleAssignPatient = async (patientId, newDoctorId, previousDoctorId) => {
    try {
      // Remove from previous doctor if exists
      if (previousDoctorId) {
        await updateDoc(doc(firestore, 'doctors', previousDoctorId), {
          patients: arrayRemove(patientId)
        });
      }

      // Add to new doctor
      if (newDoctorId) {
        await updateDoc(doc(firestore, 'doctors', newDoctorId), {
          patients: arrayUnion(patientId)
        });
      }

      // Update patient's assignedDoctorId
      await updateDoc(doc(firestore, 'patients', patientId), {
        assignedDoctorId: newDoctorId || null
      });

      await fetchPatients();
      await fetchDoctors();
      alert('✅ Patient assignment updated successfully!');
    } catch (error) {
      console.error('Error assigning patient:', error);
      alert('❌ Error assigning patient: ' + error.message);
    }
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

  // Get doctor name by ID
  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? doctor.name : 'Unknown';
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1><FaUserShield /> Admin Dashboard</h1>
        <p>Manage patients, doctors, and system users</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'patients' ? 'active' : ''}`}
          onClick={() => setActiveTab('patients')}
        >
          <FaUserInjured /> Patients ({patients.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'doctors' ? 'active' : ''}`}
          onClick={() => setActiveTab('doctors')}
        >
          <FaUserMd /> Doctors ({doctors.length})
        </button>
      </div>

      <div className="admin-content">
        {/* PATIENTS TAB */}
        {activeTab === 'patients' && (
          <>
            <div className="add-user-section">
              <h2><FaUserPlus /> Add New Patient</h2>
              <form onSubmit={handleAddPatient} className="user-form">
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
                <button type="submit" disabled={loading} className="add-button">
                  {loading ? 'Adding Patient...' : 'Add Patient'}
                </button>
              </form>
            </div>

            <div className="users-list-section">
              <h2>Patients List ({patients.length})</h2>
              <div className="users-table">
                {patients.map(patient => (
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
                        
                        {/* Doctor Assignment Badge */}
                        {patient.assignedDoctorId ? (
                          <span className="info-badge" style={{ background: '#dbeafe', color: '#1e40af' }}>
                            👨‍⚕️ Dr. {getDoctorName(patient.assignedDoctorId)}
                          </span>
                        ) : (
                          <span className="info-badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                            Unassigned
                          </span>
                        )}
                      </div>
                      
                      {/* Assign Doctor Dropdown */}
                      <div style={{ marginTop: '12px' }}>
                        <select
                          value={patient.assignedDoctorId || ''}
                          onChange={(e) => handleAssignPatient(patient.id, e.target.value, patient.assignedDoctorId)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '2px solid #e5e7eb',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="">Unassign / Select Doctor</option>
                          {doctors.map(doctor => (
                            <option key={doctor.id} value={doctor.id}>
                              Dr. {doctor.name} ({doctor.specialization})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeletePatient(patient.id)}
                      className="delete-button"
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                ))}
                {patients.length === 0 && (
                  <p className="no-data">No patients found. Add your first patient above.</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* DOCTORS TAB */}
        {activeTab === 'doctors' && (
          <>
            <div className="add-user-section">
              <h2><FaUserPlus /> Add New Doctor</h2>
              <form onSubmit={handleAddDoctor} className="user-form">
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={newDoctor.name}
                    onChange={(e) => setNewDoctor({...newDoctor, name: e.target.value})}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={newDoctor.email}
                    onChange={(e) => setNewDoctor({...newDoctor, email: e.target.value})}
                    required
                  />
                </div>
                <div className="form-row">
                  <input
                    type="password"
                    placeholder="Password (min 6 characters) *"
                    value={newDoctor.password}
                    onChange={(e) => setNewDoctor({...newDoctor, password: e.target.value})}
                    required
                    minLength="6"
                  />
                  <input
                    type="text"
                    placeholder="Specialization *"
                    value={newDoctor.specialization}
                    onChange={(e) => setNewDoctor({...newDoctor, specialization: e.target.value})}
                    required
                  />
                </div>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="License Number *"
                    value={newDoctor.licenseNumber}
                    onChange={(e) => setNewDoctor({...newDoctor, licenseNumber: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Department *"
                    value={newDoctor.department}
                    onChange={(e) => setNewDoctor({...newDoctor, department: e.target.value})}
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="add-button">
                  {loading ? 'Adding Doctor...' : 'Add Doctor'}
                </button>
              </form>
            </div>

            <div className="users-list-section">
              <h2>Doctors List ({doctors.length})</h2>
              <div className="users-table">
                {doctors.map(doctor => {
                  const patientCount = doctor.patients ? doctor.patients.length : 0;
                  return (
                    <div key={doctor.id} className="user-row doctor-row">
                      <div className="user-icon"><FaUserMd color="#3b82f6" size={28} /></div>
                      <div className="user-details">
                        <h4>{doctor.name}</h4>
                        <p>{doctor.email}</p>
                        <div className="doctor-info">
                          <span className="info-badge">{doctor.specialization}</span>
                          <span className="info-badge">{doctor.department}</span>
                          <span className="info-badge">License: {doctor.licenseNumber}</span>
                          <span className="info-badge" style={{ background: '#d1fae5', color: '#065f46' }}>
                            👥 {patientCount} Patient{patientCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteDoctor(doctor.id)}
                        className="delete-button"
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  );
                })}
                {doctors.length === 0 && (
                  <p className="no-data">No doctors found. Add your first doctor above.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
