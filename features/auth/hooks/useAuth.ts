import { useApp } from '../../../contexts/AppContext';
import { showToast } from '../../../lib/toast';

export const useAuth = () => {
  const { login: contextLogin, logout: contextLogout, user } = useApp();

  const login = (email: string) => {
    contextLogin(email);
    showToast.success('Welcome back!');
  };

  const logout = () => {
    contextLogout();
    showToast.success('Logged out successfully');
  };

  return {
    user,
    login,
    logout
  };
};