import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeProfile } = useApp();
  
  if (!activeProfile) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};