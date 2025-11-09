import React from 'react';
import Login from '../components/Auth/Login';
import Register from '../components/Auth/Register';
import PatientDashboard from '../components/Dashboard/PatientDashboard';
import DoctorDashboard from '../components/Dashboard/DoctorDashboard';
import AdminDashboard from '../components/Dashboard/AdminDashboard';
import HealthHistory from '../components/HealthHistory/HealthHistory';
import About from '../components/About/About';

// Public routes - accessible without authentication
export const publicRoutes = [
  {
    path: '/login',
    element: <Login />,
    name: 'Login',
  },
  {
    path: '/register',
    element: <Register />,
    name: 'Register',
  },
];

// Protected routes - require authentication and specific roles
export const protectedRoutes = [
  {
    path: '/patient-dashboard',
    element: <PatientDashboard />,
    allowedRoles: ['patient'],
    name: 'Patient Dashboard',
  },
  {
    path: '/doctor-dashboard',
    element: <DoctorDashboard />,
    allowedRoles: ['doctor'],
    name: 'Doctor Dashboard',
  },
  {
    path: '/admin-dashboard',
    element: <AdminDashboard />,
    allowedRoles: ['admin'],
    name: 'Admin Dashboard',
  },
  {
    path: '/health-history',
    element: <HealthHistory />,
    allowedRoles: ['doctor', 'patient'],
    name: 'Health History',
  },
  {
    path: '/about',
    element: <About />,
    allowedRoles: ['doctor', 'patient', 'admin'],
    name: 'About',
  },
];

// Helper function to get the correct dashboard path based on user role
export const getDashboardPath = (role) => {
  const dashboards = {
    doctor: '/doctor-dashboard',
    patient: '/patient-dashboard',
    admin: '/admin-dashboard',
  };
  return dashboards[role] || '/login';
};

// Helper function to check if user has access to a route
export const hasAccess = (userRole, allowedRoles) => {
  if (!allowedRoles) return true;
  return allowedRoles.includes(userRole);
};

// Get routes accessible by a specific role (useful for dynamic menus)
export const getRoutesByRole = (role) => {
  return protectedRoutes.filter(route => 
    route.allowedRoles && route.allowedRoles.includes(role)
  );
};
