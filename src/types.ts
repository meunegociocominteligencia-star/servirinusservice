/**
 * Types and interfaces for the Severinu Service Marketplace.
 * Matches the Supabase database schema requested.
 */

export type UserRole = 'client' | 'provider' | 'admin';

export interface Profile {
  id: string; // Supabase auth.users UUID
  email: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  password?: string;
}

export interface ClientProfile {
  id: string; // maps to profile.id
  cpf: string;
  birth_date: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  rating_score: number; // calculated score
  status: 'active' | 'suspended';
  created_at: string;
}

export interface ProviderProfile {
  id: string; // maps to profile.id
  cpf_cnpj: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  category_id: string;
  specialty: string;
  description: string;
  pix_key: string;
  gallery_urls: string[]; // images uploaded of past jobs
  document_url?: string; // proof of identity upload
  residence_proof_url?: string; // proof of residence upload
  status: 'pending' | 'approved' | 'rejected' | 'blocked';
  rating_average: number;
  total_reviews: number;
  total_completed_services: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon_name: string;
  description?: string;
  created_at: string;
}

export interface ServiceRequest {
  id: string;
  client_id: string;
  provider_id: string;
  category_id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  photos_urls: string[];
  suggested_value: number;
  final_value?: number;
  scheduled_date: string;
  status: 'waiting' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  status_payment: 'unpaid' | 'pending_payment' | 'paid';
  created_at: string;
}

export interface Payment {
  id: string;
  request_id: string;
  amount: number;
  pix_key_recipient: string;
  qr_code_base64: string;
  pix_copy_paste: string;
  status: 'pending' | 'completed' | 'failed';
  paid_at?: string;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string; // 'Básico/Gratuito', 'Profissional', 'Premium'
  price: number; // 0.00, 30.00, 50.90
  duration_days: number;
  features: string[];
}

export interface ProviderSubscription {
  id: string;
  provider_id: string;
  plan_id: string;
  status: 'active' | 'suspended' | 'expired';
  start_date: string;
  end_date: string;
  last_payment_value: number;
  created_at: string;
}

export interface Review {
  id: string;
  request_id: string;
  reviewer_id: string; // client_id or provider_id
  target_id: string; // provider_id or client_id
  type: 'client_to_provider' | 'provider_to_client';
  rating: number; // 1-5
  comment: string;
  photos_urls?: string[];
  created_at: string;
}

export interface Favorite {
  id: string;
  client_id: string;
  provider_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  client_id: string;
  provider_id: string;
  last_message_text?: string;
  updated_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text?: string;
  file_url?: string;
  file_type?: 'image' | 'audio' | 'document' | 'other';
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'service_request' | 'chat' | 'payment' | 'system';
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string; // 'Login', 'Logout', 'Cadastro', 'Pagamento', 'Avaliação', 'Criação de serviço', 'Cancelamento', 'Alteração financeira', 'Exclusão'
  ip: string;
  browser: string;
  details?: string;
  created_at: string;
}

export interface FinancialLog {
  id: string;
  type: 'plan_payment' | 'service_settlement';
  provider_id?: string;
  amount: number;
  payment_method: 'PIX';
  reference_id: string; // request_id or subscription_id
  status: 'pending' | 'completed';
  created_at: string;
}

export interface SystemSettings {
  id: string;
  marketing_text?: string;
  commission_rate_percent?: number;
  support_whatsapp?: string;
  pix_recipient_name?: string;
  pix_recipient_city?: string;
  pix_recipient_key?: string;
}

export interface ServiceBid {
  id: string;
  request_id: string;
  provider_id: string;
  value: number;
  message: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'rejected';
}

