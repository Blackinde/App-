import { create } from 'zustand';
import axios from 'axios';
import { Service } from '@/src/types';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface ServicesState {
  services: Service[];
  categories: { id: string; name: string; icon: string }[];
  selectedCategory: string | null;
  isLoading: boolean;
  error: string | null;
  fetchServices: (category?: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  getServiceBySlug: (slug: string) => Promise<Service | null>;
  setSelectedCategory: (category: string | null) => void;
}

export const useServicesStore = create<ServicesState>((set, get) => ({
  services: [],
  categories: [],
  selectedCategory: null,
  isLoading: false,
  error: null,

  fetchServices: async (category?: string) => {
    set({ isLoading: true, error: null });
    try {
      const url = category 
        ? `${API_URL}/api/services?category=${encodeURIComponent(category)}`
        : `${API_URL}/api/services`;
      const response = await axios.get(url);
      set({ services: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: 'Error al cargar servicios', isLoading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/services/categories`);
      set({ categories: response.data });
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  },

  getServiceBySlug: async (slug: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/services/${slug}`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  setSelectedCategory: (category) => {
    set({ selectedCategory: category });
  },
}));
