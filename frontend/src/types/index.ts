// Tramitly Type Definitions

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  balance: number;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  short_description: string;
  price: number;
  estimated_time: string;
  requirements: string[];
  required_fields: string[];
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  service_id: string;
  service_name?: string;
  status: OrderStatus;
  amount: number;
  input_data: Record<string, any>;
  result_data?: Record<string, any>;
  pdf_url?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund';
  amount: number;
  reference?: string;
  status: 'pending' | 'approved' | 'rejected';
  description?: string;
  created_at: string;
}

export interface ApiLog {
  id: string;
  order_id?: string;
  endpoint: string;
  request_summary?: string;
  status_code: number;
  created_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface DashboardStats {
  balance: number;
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  processing_orders: number;
  recent_activity: ActivityItem[];
}

export interface ActivityItem {
  type: 'order' | 'transaction';
  title: string;
  description: string;
  status: string;
  amount: number;
  created_at: string;
}

export interface AdminDashboardStats {
  total_users: number;
  total_orders: number;
  total_revenue: number;
  active_services: number;
  orders_by_status: Record<string, number>;
  recent_orders: Order[];
  recent_users: User[];
}
