import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Profile } from '../types';
import { dbService } from '../services/dbService';

interface AppContextType {
  user: Profile | null;
  login: (email: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(dbService.getCurrentUser());

  const login = (email: string) => {
    const profile = dbService.login(email);
    setUser(profile);
  };

  const logout = () => {
    dbService.logout();
    setUser(null);
  };

  return (
    <AppContext.Provider value={{ user, login, logout }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};