import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { ROUTES } from '../../constants/routes';

const PrivateRoute = ({ children, allowedRoles }) => {
  // Authentication check temporarily disabled as per user request
  return children;
};

export default PrivateRoute;
