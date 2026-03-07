import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useApp();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};