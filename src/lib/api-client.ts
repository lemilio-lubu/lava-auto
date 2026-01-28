/**
 * API Client for Microservices
 * This module provides a unified interface to communicate with the API Gateway
 */

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
}

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, token } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_GATEWAY_URL}${endpoint}`, config);

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      data?.error || `Request failed with status ${response.status}`,
      response.status,
      data
    );
  }

  return data as T;
}

// Auth API
export const authApi = {
  register: (data: { name: string; email: string; password: string; phone?: string; role?: string }) =>
    apiRequest<{ user: { id: string; name: string; email: string; role: string }; token: string }>(
      '/api/auth/register',
      { method: 'POST', body: data }
    ),

  login: (email: string, password: string) =>
    apiRequest<{ user: { id: string; name: string; email: string; role: string }; token: string }>(
      '/api/auth/login',
      { method: 'POST', body: { email, password } }
    ),

  getMe: (token: string) =>
    apiRequest<{ id: string; name: string; email: string; role: string }>(
      '/api/auth/me',
      { token }
    ),

  requestPasswordReset: (email: string) =>
    apiRequest<{ message: string }>(
      '/api/auth/reset-password/request',
      { method: 'POST', body: { email } }
    ),

  confirmPasswordReset: (resetToken: string, password: string) =>
    apiRequest<{ message: string }>(
      '/api/auth/reset-password/confirm',
      { method: 'POST', body: { token: resetToken, password } }
    ),
};

// Vehicle API
export const vehicleApi = {
  getAll: (token: string) =>
    apiRequest<Vehicle[]>('/api/vehicles', { token }),

  getById: (id: string, token: string) =>
    apiRequest<Vehicle>(`/api/vehicles/${id}`, { token }),

  create: (data: CreateVehicleData, token: string) =>
    apiRequest<Vehicle>('/api/vehicles', { method: 'POST', body: data, token }),

  update: (id: string, data: Partial<CreateVehicleData>, token: string) =>
    apiRequest<Vehicle>(`/api/vehicles/${id}`, { method: 'PUT', body: data, token }),

  delete: (id: string, token: string) =>
    apiRequest<{ message: string }>(`/api/vehicles/${id}`, { method: 'DELETE', token }),
};

// Service API
export const serviceApi = {
  getAll: (token: string, vehicleType?: string) =>
    apiRequest<Service[]>(
      vehicleType ? `/api/services?vehicleType=${vehicleType}` : '/api/services',
      { token }
    ),

  getByVehicleType: (vehicleType: string, token: string) =>
    apiRequest<Service[]>(`/api/services/type/${vehicleType}`, { token }),

  getById: (id: string, token: string) =>
    apiRequest<Service>(`/api/services/${id}`, { token }),

  create: (data: { name: string; description?: string; duration: number; price: number; vehicleType: string }, token: string) =>
    apiRequest<Service>('/api/services', { method: 'POST', body: data, token }),

  update: (id: string, data: Partial<{ name: string; description?: string; duration: number; price: number; vehicleType: string; isActive: boolean }>, token: string) =>
    apiRequest<Service>(`/api/services/${id}`, { method: 'PUT', body: data, token }),

  delete: (id: string, token: string) =>
    apiRequest<{ message: string }>(`/api/services/${id}`, { method: 'DELETE', token }),
};

// Reservation API
export const reservationApi = {
  getAll: (token: string, status?: string) =>
    apiRequest<Reservation[]>(
      status ? `/api/reservations?status=${status}` : '/api/reservations',
      { token }
    ),

  getMyReservations: (token: string, status?: string) =>
    apiRequest<Reservation[]>(
      status ? `/api/reservations?status=${status}` : '/api/reservations',
      { token }
    ),

  getAllReservations: (token: string, status?: string) =>
    apiRequest<Reservation[]>(
      status ? `/api/reservations/all?status=${status}` : '/api/reservations/all',
      { token }
    ),

  getById: (id: string, token: string) =>
    apiRequest<Reservation>(`/api/reservations/${id}`, { token }),

  create: (data: CreateReservationData, token: string) =>
    apiRequest<Reservation>('/api/reservations', { method: 'POST', body: data, token }),

  cancel: (id: string, token: string) =>
    apiRequest<Reservation>(`/api/reservations/${id}/cancel`, { method: 'POST', token }),

  update: (id: string, data: Partial<CreateReservationData>, token: string) =>
    apiRequest<Reservation>(`/api/reservations/${id}`, { method: 'PUT', body: data, token }),

  assignWasher: (id: string, washerId: string, token: string) =>
    apiRequest<Reservation>(`/api/reservations/${id}/assign`, { method: 'POST', body: { washerId }, token }),

  getStats: (token: string) =>
    apiRequest<ReservationStats>('/api/reservations/stats', { token }),
};

// Job API (for washers)
export const jobApi = {
  getAvailable: (token: string) =>
    apiRequest<Reservation[]>('/api/jobs/available', { token }),

  getMyJobs: (token: string, status?: string) =>
    apiRequest<Reservation[]>(
      status ? `/api/jobs/my-jobs?status=${status}` : '/api/jobs/my-jobs',
      { token }
    ),

  accept: (id: string, token: string) =>
    apiRequest<Reservation>(`/api/jobs/${id}/accept`, { method: 'POST', token }),

  start: (id: string, token: string) =>
    apiRequest<Reservation>(`/api/jobs/${id}/start`, { method: 'POST', token }),

  complete: (id: string, proofImages: string[], token: string) =>
    apiRequest<Reservation>(`/api/jobs/${id}/complete`, { 
      method: 'POST', 
      body: { proofImages }, 
      token 
    }),

  updateEta: (id: string, estimatedArrival: string, token: string) =>
    apiRequest<Reservation>(`/api/jobs/${id}/eta`, { method: 'PUT', body: { estimatedArrival }, token }),
};

// Rating API
export const ratingApi = {
  getByWasher: (washerId: string, token: string) =>
    apiRequest<{ ratings: Rating[]; average: number; total: number }>(
      `/api/ratings/washer/${washerId}`,
      { token }
    ),

  create: (data: { reservationId: string; stars: number; comment?: string }, token: string) =>
    apiRequest<Rating>('/api/ratings', { method: 'POST', body: data, token }),
};

// Payment API
export const paymentApi = {
  getAll: (token: string) =>
    apiRequest<Payment[]>('/api/payments', { token }),

  getAllAdmin: (token: string) =>
    apiRequest<Payment[]>('/api/payments/all', { token }),

  getByReservation: (reservationId: string, token: string) =>
    apiRequest<Payment[]>(`/api/payments/reservation/${reservationId}`, { token }),

  create: (data: { reservationId: string; amount: number; paymentMethod: string }, token: string) =>
    apiRequest<Payment>('/api/payments', { method: 'POST', body: data, token }),

  createIntent: (data: { reservationId: string; amount: number }, token: string) =>
    apiRequest<{ clientSecret: string; paymentId: string; isMock?: boolean }>(
      '/api/payments/create-intent',
      { method: 'POST', body: data, token }
    ),

  mockConfirm: (data: { paymentId: string; cardNumber: string; cardExpiry: string; cardCvc: string; cardName: string }, token: string) =>
    apiRequest<{ success: boolean; payment: Payment; message: string }>(
      '/api/payments/mock-confirm',
      { method: 'POST', body: data, token }
    ),

  confirm: (id: string, token: string) =>
    apiRequest<Payment>(`/api/payments/${id}/confirm`, { method: 'POST', token }),
};

// Notification API
export const notificationApi = {
  getAll: (token: string, unreadOnly = false) =>
    apiRequest<Notification[]>(
      unreadOnly ? '/api/notifications?unreadOnly=true' : '/api/notifications',
      { token }
    ),

  getUnreadCount: (token: string) =>
    apiRequest<{ count: number }>('/api/notifications/unread-count', { token }),

  markAsRead: (id: string, token: string) =>
    apiRequest<Notification>(`/api/notifications/${id}/read`, { method: 'PUT', token }),

  markAllAsRead: (token: string) =>
    apiRequest<{ message: string }>('/api/notifications/read-all', { method: 'PUT', token }),
};

// Chat API
export const chatApi = {
  getConversations: (token: string) =>
    apiRequest<{ other_user_id: string; other_user_name: string; last_message_at: string; unread_count: number }[]>(
      '/api/chat/conversations',
      { token }
    ),

  getConversation: (otherUserId: string, token: string) =>
    apiRequest<Message[]>(`/api/chat/conversation/${otherUserId}`, { token }),

  sendMessage: (receiverId: string, content: string, token: string, receiverRole?: string) =>
    apiRequest<Message>('/api/chat/send', { method: 'POST', body: { receiverId, content, receiverRole }, token }),

  getUnreadCount: (token: string) =>
    apiRequest<{ count: number }>('/api/chat/unread-count', { token }),
  
  markAsRead: (messageId: string, token: string) =>
    apiRequest<Message>(`/api/chat/${messageId}/read`, { method: 'PUT', token }),

  getAvailableUsers: (token: string) =>
    apiRequest<{ id: string; name: string; role: string; isAvailable?: boolean }[]>(
      '/api/users/chat/available',
      { token }
    ),
};

// Washer API
export const washerApi = {
  getAll: (token: string, available?: boolean) =>
    apiRequest<Washer[]>(
      available !== undefined ? `/api/washers?available=${available}` : '/api/washers',
      { token }
    ),

  getById: (id: string, token: string) =>
    apiRequest<Washer>(`/api/washers/${id}`, { token }),

  toggleAvailability: (isAvailable: boolean, token: string) =>
    apiRequest<{ isAvailable: boolean }>('/api/washers/availability', { method: 'PUT', body: { isAvailable }, token }),

  updateLocation: (data: { latitude: number; longitude: number }, token: string) =>
    apiRequest<{ latitude: number; longitude: number }>(
      '/api/washers/location',
      { method: 'PUT', body: data, token }
    ),

  register: (data: { name: string; email: string; password: string; phone?: string; address?: string }, token: string) =>
    apiRequest<{ message: string; washer: { id: string; name: string; email: string; phone?: string; role: string } }>(
      '/api/washers/register',
      { method: 'POST', body: data, token }
    ),
};

// Admin API
export const adminApi = {
  getUsers: (token: string, role?: string) =>
    apiRequest<User[]>(
      role ? `/api/users?role=${role}` : '/api/users',
      { token }
    ),

  getUserById: (id: string, token: string) =>
    apiRequest<User>(`/api/users/${id}`, { token }),

  updateUser: (id: string, data: Partial<User>, token: string) =>
    apiRequest<User>(`/api/users/${id}`, { method: 'PUT', body: data, token }),

  deleteUser: (id: string, token: string) =>
    apiRequest<{ message: string }>(`/api/users/${id}`, { method: 'DELETE', token }),
};

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'CLIENT' | 'WASHER';
  isAvailable?: boolean;
  rating?: number;
  completedServices?: number;
  createdAt?: string;
}


export interface Vehicle {
  id: string;
  userId: string;
  brand: string;
  model: string;
  plate: string;
  vehicleType: 'SEDAN' | 'SUV' | 'PICKUP' | 'VAN' | 'MOTORCYCLE';
  color?: string | null;
  year?: number;
  ownerName: string;
  ownerPhone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateVehicleData {
  brand: string;
  model: string;
  plate: string;
  vehicleType: string;
  color?: string;
  year?: number;
  ownerName: string;
  ownerPhone?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  vehicleType: string;
  isActive: boolean;
}

export interface Reservation {
  id: string;
  userId: string;
  vehicleId: string;
  serviceId: string;
  serviceName?: string;
  serviceDuration?: number;
  washerId?: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  notes?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  startedAt?: string;
  completedAt?: string;
  estimatedArrival?: string;
  createdAt: string;
}

export interface CreateReservationData {
  vehicleId: string;
  serviceId: string;
  scheduledDate: string;
  scheduledTime: string;
  notes?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface ReservationStats {
  pending: string;
  confirmed: string;
  in_progress: string;
  completed: string;
  cancelled: string;
  total: string;
}

export interface Rating {
  id: string;
  reservationId: string;
  userId: string;
  washerId: string;
  stars: number;
  comment?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  reservationId: string;
  userId: string;
  amount: number;
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface Washer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  isAvailable: boolean;
  rating: number;
  completedServices: number;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export { ApiError };
