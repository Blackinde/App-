import { create } from 'zustand';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  service_id: string;
  service_name: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  total_amount: number;
  submitted_data: Record<string, any>;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  estimated_delivery: string | null;
}

export interface Payment {
  id: string;
  order_id: string;
  method: string;
  amount: number;
  reference: string;
  receipt_data: string | null;
  status: string;
  created_at: string;
  confirmed_at: string | null;
}

export interface Document {
  id: string;
  order_id: string;
  file_name: string;
  file_data: string;
  uploaded_at: string;
}

interface OrdersState {
  orders: Order[];
  currentOrder: Order | null;
  documents: Document[];
  payment: Payment | null;
  isLoading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  fetchOrderById: (id: string) => Promise<void>;
  createOrder: (serviceId: string, submittedData: Record<string, any>) => Promise<Order>;
  fetchPayment: (orderId: string) => Promise<void>;
  createPayment: (orderId: string, method: string, reference: string, receiptData?: string) => Promise<void>;
  fetchDocuments: (orderId: string) => Promise<void>;
}

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  currentOrder: null,
  documents: [],
  payment: null,
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
    set({ isLoading: true, error: null });
    try {
      const headers = await getAuthHeader();
      const response = await axios.get(`${API_URL}/api/orders/${id}`, { headers });
      set({ currentOrder: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: 'Error al cargar pedido', isLoading: false });
    }
  },

  createOrder: async (serviceId: string, submittedData: Record<string, any>) => {
    set({ isLoading: true, error: null });
    try {
      const headers = await getAuthHeader();
      const response = await axios.post(
        `${API_URL}/api/orders`,
        { service_id: serviceId, submitted_data: submittedData },
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
      set({ error: 'Error al crear pedido', isLoading: false });
      throw error;
    }
  },

  fetchPayment: async (orderId: string) => {
    try {
      const headers = await getAuthHeader();
      const response = await axios.get(`${API_URL}/api/payments/${orderId}`, { headers });
      set({ payment: response.data });
    } catch (error) {
      set({ payment: null });
    }
  },

  createPayment: async (orderId: string, method: string, reference: string, receiptData?: string) => {
    try {
      const headers = await getAuthHeader();
      await axios.post(
        `${API_URL}/api/payments`,
        { order_id: orderId, method, reference, receipt_data: receiptData },
        { headers }
      );
      await get().fetchOrderById(orderId);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error al registrar pago');
    }
  },

  fetchDocuments: async (orderId: string) => {
    try {
      const headers = await getAuthHeader();
      const response = await axios.get(`${API_URL}/api/documents/${orderId}`, { headers });
      set({ documents: response.data });
    } catch (error) {
      set({ documents: [] });
    }
  },
}));
