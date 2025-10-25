import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaBars, FaTimes, FaHome, FaHistory, FaInfoCircle, FaSignOutAlt, FaUserShield } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const getDashboardLink = () => {
    if (userRole === 'doctor') return '/doctor-dashboard';
    if (userRole === 'patient') return '/patient-dashboard';
    if (userRole === 'admin') return '/admin-dashboard';
    return '/';
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo">
          <span className="logo-icon">❤️</span>
          <span>Health Monitor</span>
        </div>

        <button 
          className="mobile-menu-button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          <Link to={getDashboardLink()} className="nav-link">
            <FaHome /> Dashboard
          </Link>
          
          {(userRole === 'doctor' || userRole === 'patient') && (
            <Link to="/health-history" className="nav-link">
              <FaHistory /> Health History
            </Link>
          )}
          
          <Link to="/about" className="nav-link">
            <FaInfoCircle /> About
          </Link>

          {userRole === 'admin' && (
            <Link to="/admin-dashboard" className="nav-link">
              <FaUserShield /> Admin Panel
            </Link>
          )}

          <button onClick={handleLogout} className="nav-link logout-button">
            <FaSignOutAlt /> Logout
          </button>
        </div>

        <div className="user-info">
          <span className="user-role-badge">{userRole}</span>
          <span className="user-email">{currentUser?.email}</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
