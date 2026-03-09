import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LocalProfile } from '../types';
import { dbService } from '../services/dbService';

interface AppContextType {
  activeProfile: LocalProfile | null;
  setActiveProfile: (profile: LocalProfile | null) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeProfile, setActiveProfile] = useState<LocalProfile | null>(dbService.getActiveProfile());

  const logout = () => {
    dbService.logout();
    setActiveProfile(null);
  };

  return (
    <AppContext.Provider value={{ activeProfile, setActiveProfile, logout }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};