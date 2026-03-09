import { useApp } from '../../../contexts/AppContext';
import { showToast } from '../../../lib/toast';

export const useAuth = () => {
  const { setActiveProfile, logout: contextLogout, activeProfile } = useApp();

  const login = (profile: any) => {
    setActiveProfile(profile);
    showToast.success('Welcome back!');
  };

  const logout = () => {
    contextLogout();
    showToast.success('Logged out successfully');
  };

  return {
    activeProfile,
    login,
    logout
  };
};