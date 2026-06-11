import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
      fetchUser();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      // In development we might be running frontend on 5173 and backend on 8000
      const res = await axios.get('/api/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error("Failed to fetch user", err);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const res = await axios.post('/api/auth/login', formData);
    setToken(res.data.access_token);
  }, []);

  const googleLogin = useCallback(async (code, redirectUri) => {
    const res = await axios.post('/api/auth/google', {
      code,
      redirect_uri: redirectUri
    });
    setToken(res.data.access_token);
  }, []);

  const register = useCallback(async (email, password, fullName) => {
    await axios.post('/api/auth/register', { email, password, full_name: fullName });
    await login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, googleLogin, register, logout, loading, token }}>
      {children}
    </AuthContext.Provider>
  );
};
