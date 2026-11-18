import { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await authService.getMe();
      setUser(data);
    } catch (error) {
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const data = await authService.login(credentials);
      if (data?.token) {
        localStorage.setItem('token', data.token);
      }
      setUser(data);
      toast.success('Logged in successfully');
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Login failed';
      toast.error(msg);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      toast.success(data?.message || 'Verification code sent to your email');
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Registration failed';
      toast.error(msg);
      throw error;
    }
  };

  const verifyOtp = async (verificationData) => {
    try {
      const data = await authService.verifyOtp(verificationData);
      if (data?.token) {
        localStorage.setItem('token', data.token);
      }
      setUser(data);
      toast.success('Email verified successfully! Welcome to Coinomart.');
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'OTP verification failed';
      toast.error(msg);
      throw error;
    }
  };

  const resendVerification = async (email) => {
    try {
      const data = await authService.resendVerification(email);
      toast.success(data?.message || 'New verification code sent');
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to resend code';
      toast.error(msg);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // ignore
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const updateUser = (updatedUserData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUserData } : updatedUserData));
  };

  const value = {
    user,
    loading,
    login,
    register,
    verifyOtp,
    resendVerification,
    logout,
    checkUser,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
