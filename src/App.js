import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { publicRoutes, protectedRoutes, getDashboardPath } from './routes';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
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
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  console.log('AppContent render:', { 
    currentUser: currentUser?.email, 
    userRole, 
    pathname: location.pathname 
  });

  return (
    <div className="App">
      {/* Show Navbar only when logged in and not on auth pages */}
      {currentUser && !isAuthPage && <Navbar />}
      
      <Routes>
        {/* Public Routes (Login, Register) */}
        {publicRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              currentUser && userRole ? (
                // If already logged in, redirect to appropriate dashboard
                <Navigate to={getDashboardPath(userRole)} replace />
              ) : (
                // Not logged in, show the public route
                route.element
              )
            }
          />
        ))}

        {/* Protected Routes (Dashboards, Health History, About) */}
        {protectedRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <ProtectedRoute allowedRoles={route.allowedRoles}>
                {route.element}
              </ProtectedRoute>
            }
          />
        ))}

        {/* Root Route - Redirect to appropriate dashboard or login */}
        <Route
          path="/"
          element={
            currentUser && userRole ? (
              <Navigate to={getDashboardPath(userRole)} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* 404 - Catch all unknown routes and redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      
      {/* Show Chatbot only when logged in and not on auth pages */}
      {currentUser && !isAuthPage && <Chatbot />}
    </div>
  );
};

export default App;
