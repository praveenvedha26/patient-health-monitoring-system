import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import PatientDashboard from './components/Dashboard/PatientDashboard';
import DoctorDashboard from './components/Dashboard/DoctorDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import HealthHistory from './components/HealthHistory/HealthHistory';
import About from './components/About/About';
import Navbar from './components/Navigation/Navbar';
import Chatbot from './components/Chatbot/Chatbot';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

const AppContent = () => {
  const { currentUser, userRole } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  console.log('AppContent render:', { 
    currentUser: currentUser?.email, 
    userRole, 
    pathname: location.pathname 
  });

  return (
    <div className="App">
      {/* Only show Navbar if user is logged in AND not on login page */}
      {currentUser && !isLoginPage && <Navbar />}
      
      <Routes>
        {/* Login Route */}
        <Route 
          path="/login" 
          element={
            currentUser ? (
              // If already logged in, redirect to appropriate dashboard
              <Navigate to={
                userRole === 'doctor' ? '/doctor-dashboard' :
                userRole === 'patient' ? '/patient-dashboard' :
                userRole === 'admin' ? '/admin-dashboard' :
                '/login'
              } replace />
            ) : (
              <Login />
            )
          } 
        />
        
        {/* Patient Dashboard */}
        <Route 
          path="/patient-dashboard" 
          element={
            currentUser && userRole === 'patient' ? (
              <PatientDashboard />
            ) : currentUser ? (
              // Wrong role, redirect to correct dashboard
              <Navigate to={
                userRole === 'doctor' ? '/doctor-dashboard' :
                userRole === 'admin' ? '/admin-dashboard' :
                '/login'
              } replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Doctor Dashboard */}
        <Route 
          path="/doctor-dashboard" 
          element={
            currentUser && userRole === 'doctor' ? (
              <DoctorDashboard />
            ) : currentUser ? (
              <Navigate to={
                userRole === 'patient' ? '/patient-dashboard' :
                userRole === 'admin' ? '/admin-dashboard' :
                '/login'
              } replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Admin Dashboard */}
        <Route 
          path="/admin-dashboard" 
          element={
            currentUser && userRole === 'admin' ? (
              <AdminDashboard />
            ) : currentUser ? (
              <Navigate to={
                userRole === 'doctor' ? '/doctor-dashboard' :
                userRole === 'patient' ? '/patient-dashboard' :
                '/login'
              } replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Health History */}
        <Route 
          path="/health-history" 
          element={
            currentUser && (userRole === 'doctor' || userRole === 'patient') ? (
              <HealthHistory />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* About */}
        <Route 
          path="/about" 
          element={
            currentUser ? (
              <About />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Root Route */}
        <Route 
          path="/" 
          element={
            currentUser ? (
              <Navigate to={
                userRole === 'doctor' ? '/doctor-dashboard' :
                userRole === 'patient' ? '/patient-dashboard' :
                userRole === 'admin' ? '/admin-dashboard' :
                '/login'
              } replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      
      {/* Only show Chatbot if user is logged in AND not on login page */}
      {currentUser && !isLoginPage && <Chatbot />}
    </div>
  );
};

export default App;
