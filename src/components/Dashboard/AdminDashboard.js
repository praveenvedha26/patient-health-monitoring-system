import React, { useState, useEffect } from 'react';
import { firestore } from '../../config/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { FaUserPlus, FaTrash, FaUserMd, FaUserInjured, FaUserShield } from 'react-icons/fa';
import './Dashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'patient',
    name: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const usersCollection = collection(firestore, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    const usersList = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setUsers(usersList);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );

      await addDoc(collection(firestore, 'users'), {
        uid: userCredential.user.uid,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        createdAt: new Date().toISOString()
      });

      setNewUser({ email: '', password: '', role: 'patient', name: '' });
      fetchUsers();
      alert('User added successfully!');
    } catch (error) {
      alert('Error adding user: ' + error.message);
    }
    setLoading(false);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(firestore, 'users', userId));
        fetchUsers();
        alert('User deleted successfully!');
      } catch (error) {
        alert('Error deleting user: ' + error.message);
      }
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'doctor': return <FaUserMd color="#3b82f6" />;
      case 'patient': return <FaUserInjured color="#10b981" />;
      case 'admin': return <FaUserShield color="#f59e0b" />;
      default: return <FaUserInjured />;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Manage system users and permissions</p>
      </div>

      <div className="admin-content">
        <div className="add-user-section">
          <h2><FaUserPlus /> Add New User</h2>
          <form onSubmit={handleAddUser} className="user-form">
            <div className="form-row">
              <input
                type="text"
                placeholder="Full Name"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                required
              />
            </div>
            <div className="form-row">
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                required
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="add-button">
              {loading ? 'Adding...' : 'Add User'}
            </button>
          </form>
        </div>

        <div className="users-list-section">
          <h2>System Users ({users.length})</h2>
          <div className="users-table">
            {users.map(user => (
              <div key={user.id} className="user-row">
                <div className="user-icon">{getRoleIcon(user.role)}</div>
                <div className="user-details">
                  <h4>{user.name}</h4>
                  <p>{user.email}</p>
                  <span className={`role-badge ${user.role}`}>{user.role}</span>
                </div>
                <button 
                  onClick={() => handleDeleteUser(user.id)}
                  className="delete-button"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
