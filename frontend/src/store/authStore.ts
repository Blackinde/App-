import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { User } from '@/src/types';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      const { token, user } = response.data;
      await AsyncStorage.setItem('tramitly_token', token);
      await AsyncStorage.setItem('tramitly_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error al iniciar sesión');
    }
  },

  register: async (data) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, data);
      const { token, user } = response.data;
      await AsyncStorage.setItem('tramitly_token', token);
      await AsyncStorage.setItem('tramitly_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error al registrarse');
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('tramitly_token');
    await AsyncStorage.removeItem('tramitly_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const token = await AsyncStorage.getItem('tramitly_token');
      const userStr = await AsyncStorage.getItem('tramitly_user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    const { token } = get();
    if (!token) throw new Error('No autenticado');
    
    try {
      const response = await axios.put(`${API_URL}/api/auth/profile`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedUser = response.data;
      await AsyncStorage.setItem('tramitly_user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error al actualizar perfil');
    }
  },

  refreshUser: async () => {
    const { token } = get();
    if (!token) return;
    
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const user = response.data;
      await AsyncStorage.setItem('tramitly_user', JSON.stringify(user));
      set({ user });
    } catch (error) {
      // Token might be invalid, logout
      await get().logout();
    }
  },
}));
