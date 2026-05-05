import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { ROUTES } from '../../constants/routes';

/**
 * Strict PrivateRoute component that enforces authentication and role-based access.
 */
const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading, user } = useAuthStore();
  const location = useLocation();

  // If we are still checking the session from cookies, show nothing (or a loader)
  // The App.jsx handles the global loading state, but we check here too for safety
  if (loading) {
      return null; 
  }

  if (!isAuthenticated) {
    // Redirect to login but save the current location to redirect back after login
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Role mismatch, redirect to home or a forbidden page
    return <Navigate to="/" replace />;
  }

  // Force password change if it's the first login
  if (user?.isFirstLogin) {
    return <Navigate to={ROUTES.CHANGE_PASSWORD} replace />;
  }

  return children;
};

export default PrivateRoute;
