import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('shopsphere_token'));
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState(null);

  const loadUser = useCallback(async () => {
    const storedToken = localStorage.getItem('shopsphere_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await authService.getMe();
      if (res.success) {
        setUser(res.data.user);
        setSeller(res.data.seller || null);
        setToken(storedToken);
      }
    } catch {
      localStorage.removeItem('shopsphere_token');
      localStorage.removeItem('shopsphere_user');
      setUser(null);
      setSeller(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    if (res.success) {
      const { user: u, seller: s, token: t } = res.data;
      localStorage.setItem('shopsphere_token', t);
      localStorage.setItem('shopsphere_user', JSON.stringify(u));
      setUser(u);
      setSeller(s || null);
      setToken(t);
      return { user: u, seller: s };
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (data) => {
    const res = await authService.register(data);
    if (res.success) {
      return res.data;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Always clear local state even if server call fails
    }
    localStorage.removeItem('shopsphere_token');
    localStorage.removeItem('shopsphere_user');
    setUser(null);
    setSeller(null);
    setToken(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('shopsphere_user', JSON.stringify(updatedUser));
  };

  const isAuthenticated = !!user && !!token;

  const value = {
    user,
    seller,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    register,
    updateUser,
    refreshUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
