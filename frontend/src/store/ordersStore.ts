import { create } from 'zustand';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order, DashboardStats } from '@/src/types';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('tramitly_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

interface OrdersState {
  orders: Order[];
  currentOrder: Order | null;
  dashboardStats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  fetchOrderById: (id: string) => Promise<Order | null>;
  createOrder: (serviceId: string, inputData: Record<string, any>) => Promise<Order>;
  fetchDashboardStats: () => Promise<void>;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  currentOrder: null,
  dashboardStats: null,
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const headers = await getAuthHeader();
      const response = await axios.get(`${API_URL}/api/orders`, { headers });
      set({ orders: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: 'Error al cargar pedidos', isLoading: false });
    }
  },

  fetchOrderById: async (id: string) => {
    try {
      const headers = await getAuthHeader();
      const response = await axios.get(`${API_URL}/api/orders/${id}`, { headers });
      set({ currentOrder: response.data });
      return response.data;
    } catch (error) {
      return null;
    }
  },

  createOrder: async (serviceId: string, inputData: Record<string, any>) => {
    set({ isLoading: true, error: null });
    try {
      const headers = await getAuthHeader();
      const response = await axios.post(
        `${API_URL}/api/orders`,
        { service_id: serviceId, input_data: inputData },
        { headers }
      );
      const newOrder = response.data;
      set((state) => ({
        orders: [newOrder, ...state.orders],
        currentOrder: newOrder,
        isLoading: false
      }));
      return newOrder;
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Error al crear pedido';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  fetchDashboardStats: async () => {
    try {
      const headers = await getAuthHeader();
      const response = await axios.get(`${API_URL}/api/dashboard/stats`, { headers });
      set({ dashboardStats: response.data });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  },
}));
