import { create } from 'zustand';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
  short_description: string;
  full_description: string;
  price: number;
  delivery_time: string;
  required_fields: string[];
  requirements: string[];
  notes: string[];
  is_active: boolean;
  created_at: string;
}

interface ServicesState {
  services: Service[];
  categories: string[];
  selectedCategory: string | null;
  isLoading: boolean;
  error: string | null;
  fetchServices: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  setSelectedCategory: (category: string | null) => void;
  getServiceById: (id: string) => Service | undefined;
}

export const useServicesStore = create<ServicesState>((set, get) => ({
  services: [],
  categories: [],
  selectedCategory: null,
  isLoading: false,
  error: null,

  fetchServices: async () => {
    set({ isLoading: true, error: null });
    try {
      const { selectedCategory } = get();
      const url = selectedCategory 
        ? `${API_URL}/api/services?category=${encodeURIComponent(selectedCategory)}`
        : `${API_URL}/api/services`;
      const response = await axios.get(url);
      set({ services: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: 'Error al cargar servicios', isLoading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/categories`);
      set({ categories: response.data });
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  },

  setSelectedCategory: (category) => {
    set({ selectedCategory: category });
  },

  getServiceById: (id) => {
    return get().services.find(s => s.id === id);
  },
}));
