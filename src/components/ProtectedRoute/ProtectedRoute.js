import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userRole } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    const dashboards = {
      doctor: '/doctor-dashboard',
      patient: '/patient-dashboard',
      admin: '/admin-dashboard',
    };
    return <Navigate to={dashboards[userRole] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
