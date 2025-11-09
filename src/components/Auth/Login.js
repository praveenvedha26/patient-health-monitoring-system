import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate role selection
    if (!selectedRole) {
      setError('Please select your role');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Login and get the user's actual role from Firestore
      const { role } = await login(email, password);
      
      // Verify the selected role matches the user's actual role
      if (role !== selectedRole) {
        setError(`Invalid role selection. Your account is registered as ${role}.`);
        setLoading(false);
        return;
      }
      
      console.log('Login successful, role:', role);
      
      // Navigate based on role
      if (role === 'doctor') {
        navigate('/doctor-dashboard', { replace: true });
      } else if (role === 'patient') {
        navigate('/patient-dashboard', { replace: true });
      } else if (role === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else {
        setError('Unknown user role');
      }
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Smart Patient Health Monitoring System</h1>
          <p>Secure Login Portal</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="role">Select Role</label>
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              required
              disabled={loading}
              className="role-select"
            >
              <option value="">-- Choose Your Role --</option>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>
          
          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="register-section">
          <p>Don't have an account? <Link to="/register" className="register-link">Register here</Link></p>
        </div>
        
        <div className="role-info">
          <p>Access Roles: Doctor | Patient | Admin</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
