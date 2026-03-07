import { create } from 'zustand';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '@/src/types';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('tramitly_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

interface TransactionsState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  createDeposit: (amount: number, reference?: string) => Promise<{ new_balance: number }>;
}

export const useTransactionsStore = create<TransactionsState>((set) => ({
  transactions: [],
  isLoading: false,
  error: null,

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const headers = await getAuthHeader();
      const response = await axios.get(`${API_URL}/api/transactions`, { headers });
      set({ transactions: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: 'Error al cargar transacciones', isLoading: false });
    }
  },

  createDeposit: async (amount: number, reference?: string) => {
    try {
      const headers = await getAuthHeader();
      const response = await axios.post(
        `${API_URL}/api/transactions/deposit`,
        { type: 'deposit', amount, reference },
        { headers }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error al realizar depósito');
    }
  },
}));
