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
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
    identification?: string;
    city?: string;
    province?: string;
    company?: string;
  }) =>
    apiRequest<{ user: { id: string; name: string; email: string; role: string }; token: string }>(
      '/api/auth/register',
      { method: 'POST', body: data }
    ),

  login: (email: string, password: string, totpToken?: string) =>
    apiRequest<{ user: { id: string; name: string; email: string; role: string }; token: string } | { requires2FA: true }>(
      '/api/auth/login',
      { method: 'POST', body: { email, password, ...(totpToken ? { totpToken } : {}) } }
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

  changeSelfPassword: (userId: string, currentPassword: string, newPassword: string, token: string) =>
    apiRequest<{ message: string }>(
      `/api/users/${userId}/password/self`,
      { method: 'PUT', body: { currentPassword, newPassword }, token }
    ),

  setup2FA: (userId: string, token: string) =>
    apiRequest<{ secret: string; qrDataUrl: string }>(
      `/api/users/${userId}/2fa/setup`,
      { method: 'POST', token }
    ),

  verify2FA: (userId: string, totpToken: string, token: string) =>
    apiRequest<{ message: string }>(
      `/api/users/${userId}/2fa/verify`,
      { method: 'POST', body: { token: totpToken }, token }
    ),

  disable2FA: (userId: string, totpToken: string, token: string) =>
    apiRequest<{ message: string }>(
      `/api/users/${userId}/2fa`,
      { method: 'DELETE', body: { token: totpToken }, token }
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

  create: (data: ServiceWriteData, token: string) =>
    apiRequest<Service>('/api/services', { method: 'POST', body: data, token }),

  update: (id: string, data: Partial<ServiceWriteData>, token: string) =>
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

  cashPayment: (reservationId: string, token: string) =>
    apiRequest<Payment>('/api/payments/cash', { method: 'POST', body: { reservationId }, token }),

  confirmCash: (paymentId: string, token: string) =>
    apiRequest<Payment>(`/api/payments/${paymentId}/confirm-cash`, { method: 'POST', token }),
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

// Employee API
export const employeeApi = {
  getAll: (token: string, available?: boolean) =>
    apiRequest<Employee[]>(
      available !== undefined ? `/api/washers?available=${available}&limit=500` : '/api/washers?limit=500',
      { token }
    ),

  getById: (id: string, token: string) =>
    apiRequest<Employee>(`/api/washers/${id}`, { token }),

  toggleAvailability: (isAvailable: boolean, token: string) =>
    apiRequest<{ isAvailable: boolean }>('/api/washers/availability', { method: 'PUT', body: { isAvailable }, token }),

  updateLocation: (data: { latitude: number; longitude: number }, token: string) =>
    apiRequest<{ latitude: number; longitude: number }>(
      '/api/washers/location',
      { method: 'PUT', body: data, token }
    ),

  register: (data: { name: string; email: string; password: string; phone?: string; address?: string }, token: string) =>
    apiRequest<{ message: string; employee: { id: string; name: string; email: string; phone?: string; role: string } }>(
      '/api/washers/register',
      { method: 'POST', body: data, token }
    ),
};

/** @deprecated Use employeeApi instead */
export const washerApi = employeeApi;

// Admin API
export const adminApi = {
  createAdmin: (data: { name: string; email: string; password: string; phone?: string }, token: string) =>
    apiRequest<{ message: string; admin: { id: string; name: string; email: string; role: string } }>('/api/users/admin', {
      method: 'POST',
      body: data,
      token,
    }),
  getUsers: (token: string, role?: string) =>
    apiRequest<User[]>(
      role ? `/api/users?role=${role}&limit=500` : '/api/users?limit=500',
      { token }
    ),

  getUserById: (id: string, token: string) =>
    apiRequest<User>(`/api/users/${id}`, { token }),

  updateUser: (id: string, data: Partial<User>, token: string) =>
    apiRequest<User>(`/api/users/${id}`, { method: 'PUT', body: data, token }),

  deleteUser: (id: string, token: string) =>
    apiRequest<{ message: string }>(`/api/users/${id}`, { method: 'DELETE', token }),

  setUserPassword: (id: string, password: string, token: string) =>
    apiRequest<{ message: string }>(`/api/users/${id}/password`, { method: 'PUT', body: { password }, token }),
};

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'CLIENT' | 'EMPLOYEE';
  isAvailable?: boolean;
  rating?: number;
  completedServices?: number;
  mustChangePassword?: boolean;
  totpEnabled?: boolean;
  createdAt?: string;
}


export interface Vehicle {
  id: string;
  userId: string;
  brand: string;
  model: string;
  plate: string;
  vehicleType: 'SEDAN' | 'SUV' | 'HATCHBACK' | 'PICKUP' | 'VAN' | 'MOTORCYCLE';
  color?: string | null;
  year?: number;
  ownerName: string;
  ownerPhone?: string;
  isActive: boolean;
  createdAt: string;
  brandId?: string | null;
  modelId?: string | null;
  fuelTypeId?: string | null;
  brandName?: string | null;
  modelName?: string | null;
}

export interface CreateVehicleData {
  brand?: string;
  model?: string;
  plate: string;
  vehicleType: string;
  color?: string;
  year?: number;
  ownerName: string;
  ownerPhone?: string;
  brandId?: string | null;
  modelId?: string | null;
  fuelTypeId?: string | null;
}

export interface ServiceLaborItem {
  id?: string;
  laborRateId: string;
  laborRateName?: string;
  hours: number;
  ratePerHour?: number;
  subtotal?: number;
}

export interface ServicePartItem {
  id?: string;
  sparePartId: string;
  sparePartName?: string;
  quantity: number;
  unitPrice?: number;
  subtotal?: number;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  vehicleType: string;
  isActive: boolean;
  laborItems?: ServiceLaborItem[];
  partItems?: ServicePartItem[];
}

export interface ServiceWriteData {
  name: string;
  description?: string;
  duration: number;
  price?: number;
  vehicleType: string;
  isActive?: boolean;
  laborItems?: { laborRateId: string; hours: number }[];
  partItems?: { sparePartId: string; quantity: number }[];
}

export interface Reservation {
  id: string;
  userId: string;
  vehicleId: string;
  serviceId: string;
  serviceName?: string;
  serviceDuration?: number;
  employeeId?: string;
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
  employeeId: string;
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

export interface Employee {
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

/** @deprecated Use Employee instead */
export type Washer = Employee;

// Catalog types
export interface Brand { id: string; name: string; isActive: boolean; }
export interface Model { id: string; brandId: string; name: string; yearFrom?: number; yearTo?: number; isActive: boolean; }
export interface FuelType { id: string; name: string; isActive: boolean; }
export interface SparePartCategory { id: string; name: string; isActive: boolean; }
export interface SparePart { id: string; categoryId?: string; name: string; partNumber?: string; unit: string; unitPrice: number; stockQuantity: number; minStock: number; isActive: boolean; }
export interface ServiceType { id: string; name: string; description?: string; isActive: boolean; }
export interface LaborRate { id: string; name: string; description?: string; ratePerHour: number; isActive: boolean; }
export interface EmployeeSpecialty { id: string; name: string; isActive: boolean; }
export interface TaxRate { id: string; name: string; percentage: number; isActive: boolean; }
export interface OrderNumberConfig { id: string; prefix: string; nextNumber: number; padding: number; }

export const catalogApi = {
  // Brands
  getBrands: (token: string) =>
    apiRequest<{ data: Brand[] }>('/api/catalog/brands', { token }),
  createBrand: (data: Omit<Brand, 'id'>, token: string) =>
    apiRequest<{ data: Brand }>('/api/catalog/brands', { method: 'POST', body: data, token }),
  updateBrand: (id: string, data: Partial<Brand>, token: string) =>
    apiRequest<{ data: Brand }>(`/api/catalog/brands/${id}`, { method: 'PUT', body: data, token }),
  deleteBrand: (id: string, token: string) =>
    apiRequest<{ message: string }>(`/api/catalog/brands/${id}`, { method: 'DELETE', token }),

  // Models
  getModels: (token: string, brandId?: string) =>
    apiRequest<{ data: Model[] }>(`/api/catalog/models${brandId ? `?brandId=${brandId}` : ''}`, { token }),
  createModel: (data: Omit<Model, 'id'>, token: string) =>
    apiRequest<{ data: Model }>('/api/catalog/models', { method: 'POST', body: data, token }),
  updateModel: (id: string, data: Partial<Model>, token: string) =>
    apiRequest<{ data: Model }>(`/api/catalog/models/${id}`, { method: 'PUT', body: data, token }),
  deleteModel: (id: string, token: string) =>
    apiRequest<{ message: string }>(`/api/catalog/models/${id}`, { method: 'DELETE', token }),

  // FuelTypes
  getFuelTypes: (token: string) =>
    apiRequest<{ data: FuelType[] }>('/api/catalog/fuel-types', { token }),
  createFuelType: (data: Omit<FuelType, 'id'>, token: string) =>
    apiRequest<{ data: FuelType }>('/api/catalog/fuel-types', { method: 'POST', body: data, token }),
  updateFuelType: (id: string, data: Partial<FuelType>, token: string) =>
    apiRequest<{ data: FuelType }>(`/api/catalog/fuel-types/${id}`, { method: 'PUT', body: data, token }),
  deleteFuelType: (id: string, token: string) =>
    apiRequest<{ message: string }>(`/api/catalog/fuel-types/${id}`, { method: 'DELETE', token }),

  // SparePartCategories
  getSparePartCategories: (token: string) =>
    apiRequest<{ data: SparePartCategory[] }>('/api/catalog/spare-part-categories', { token }),
  createSparePartCategory: (data: Omit<SparePartCategory, 'id'>, token: string) =>
    apiRequest<{ data: SparePartCategory }>('/api/catalog/spare-part-categories', { method: 'POST', body: data, token }),
  updateSparePartCategory: (id: string, data: Partial<SparePartCategory>, token: string) =>
    apiRequest<{ data: SparePartCategory }>(`/api/catalog/spare-part-categories/${id}`, { method: 'PUT', body: data, token }),
  deleteSparePartCategory: (id: string, token: string) =>
    apiRequest<{ message: string }>(`/api/catalog/spare-part-categories/${id}`, { method: 'DELETE', token }),

  // SpareParts
  getSpareParts: (token: string, categoryId?: string) =>
    apiRequest<{ data: SparePart[] }>(`/api/catalog/spare-parts${categoryId ? `?categoryId=${categoryId}` : ''}`, { token }),
  createSparePart: (data: Omit<SparePart, 'id'>, token: string) =>
    apiRequest<{ data: SparePart }>('/api/catalog/spare-parts', { method: 'POST', body: data, token }),
  updateSparePart: (id: string, data: Partial<SparePart>, token: string) =>
    apiRequest<{ data: SparePart }>(`/api/catalog/spare-parts/${id}`, { method: 'PUT', body: data, token }),
  deleteSparePart: (id: string, token: string) =>
    apiRequest<{ message: string }>(`/api/catalog/spare-parts/${id}`, { method: 'DELETE', token }),

  // ServiceTypes
  getServiceTypes: (token: string) =>
    apiRequest<{ data: ServiceType[] }>('/api/catalog/service-types', { token }),
  createServiceType: (data: Omit<ServiceType, 'id'>, token: string) =>
    apiRequest<{ data: ServiceType }>('/api/catalog/service-types', { method: 'POST', body: data, token }),
  updateServiceType: (id: string, data: Partial<ServiceType>, token: string) =>
    apiRequest<{ data: ServiceType }>(`/api/catalog/service-types/${id}`, { method: 'PUT', body: data, token }),
  deleteServiceType: (id: string, token: string) =>
    apiRequest<{ message: string }>(`/api/catalog/service-types/${id}`, { method: 'DELETE', token }),

  // LaborRates
  getLaborRates: (token: string) =>
    apiRequest<{ data: LaborRate[] }>('/api/catalog/labor-rates', { token }),
  createLaborRate: (data: Omit<LaborRate, 'id'>, token: string) =>
    apiRequest<{ data: LaborRate }>('/api/catalog/labor-rates', { method: 'POST', body: data, token }),
  updateLaborRate: (id: string, data: Partial<LaborRate>, token: string) =>
    apiRequest<{ data: LaborRate }>(`/api/catalog/labor-rates/${id}`, { method: 'PUT', body: data, token }),
  deleteLaborRate: (id: string, token: string) =>
    apiRequest<{ message: string }>(`/api/catalog/labor-rates/${id}`, { method: 'DELETE', token }),

  // EmployeeSpecialties
  getEmployeeSpecialties: (token: string) =>
    apiRequest<{ data: EmployeeSpecialty[] }>('/api/catalog/employee-specialties', { token }),
  createEmployeeSpecialty: (data: Omit<EmployeeSpecialty, 'id'>, token: string) =>
    apiRequest<{ data: EmployeeSpecialty }>('/api/catalog/employee-specialties', { method: 'POST', body: data, token }),
  updateEmployeeSpecialty: (id: string, data: Partial<EmployeeSpecialty>, token: string) =>
    apiRequest<{ data: EmployeeSpecialty }>(`/api/catalog/employee-specialties/${id}`, { method: 'PUT', body: data, token }),
  deleteEmployeeSpecialty: (id: string, token: string) =>
    apiRequest<{ message: string }>(`/api/catalog/employee-specialties/${id}`, { method: 'DELETE', token }),

  // TaxRates
  getTaxRates: (token: string) =>
    apiRequest<{ data: TaxRate[] }>('/api/catalog/tax-rates', { token }),
  createTaxRate: (data: Omit<TaxRate, 'id'>, token: string) =>
    apiRequest<{ data: TaxRate }>('/api/catalog/tax-rates', { method: 'POST', body: data, token }),
  updateTaxRate: (id: string, data: Partial<TaxRate>, token: string) =>
    apiRequest<{ data: TaxRate }>(`/api/catalog/tax-rates/${id}`, { method: 'PUT', body: data, token }),
  deleteTaxRate: (id: string, token: string) =>
    apiRequest<{ message: string }>(`/api/catalog/tax-rates/${id}`, { method: 'DELETE', token }),

  // OrderNumberConfig (singleton)
  getOrderNumberConfig: (token: string) =>
    apiRequest<{ data: OrderNumberConfig }>('/api/catalog/order-number-config', { token }),
  updateOrderNumberConfig: (data: { prefix: string; padding: number }, token: string) =>
    apiRequest<{ data: OrderNumberConfig }>('/api/catalog/order-number-config', { method: 'PUT', body: data, token }),

  // Service templates
  getServiceTemplate: (serviceTypeId: string, token: string) =>
    apiRequest<{ data: ServiceTemplate }>(`/api/catalog/service-types/${serviceTypeId}/template`, { token }),
};

// Work Order types
export interface WorkOrderService {
  id: string;
  workOrderId: string;
  serviceTypeId?: string;
  name: string;
  description?: string;
  basePrice: number;
  sortOrder: number;
  labor?: WorkOrderLaborLine[];
  parts?: WorkOrderPartLine[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceTemplate {
  serviceType: { id: string; name: string; description?: string };
  laborTemplates: { id: string; description: string; defaultHours: number; sortOrder: number }[];
  partTemplates: { id: string; sparePartId?: string; sparePartName?: string; sparePartPrice?: number; description: string; defaultQuantity: number; sortOrder: number }[];
}

export interface WorkOrder {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName?: string;
  vehicleId: string;
  vehiclePlate?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  technicianId?: string;
  technicianName?: string;
  status: 'DRAFT' | 'OPEN' | 'DIAGNOSING' | 'PENDING_APPROVAL' | 'IN_REPAIR' | 'COMPLETED' | 'INVOICED' | 'DELIVERED' | 'CANCELLED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  mileage?: number;
  problemDescription?: string;
  diagnosis?: string;
  recommendations?: string;
  internalNotes?: string;
  estimatedCost: number;
  finalCost: number;
  servicesAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  services?: WorkOrderService[];
  labor?: WorkOrderLaborLine[];
  parts?: WorkOrderPartLine[];
  photos?: WorkOrderPhoto[];
  statusHistory?: WorkOrderStatusEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderLaborLine {
  id: string;
  workOrderId: string;
  workOrderServiceId?: string | null;
  technicianId?: string;
  laborRateId?: string;
  description: string;
  hours: number;
  ratePerHour: number;
  subtotal: number;
}

export interface WorkOrderPartLine {
  id: string;
  workOrderId: string;
  workOrderServiceId?: string | null;
  sparePartId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface WorkOrderPhoto {
  id: string;
  workOrderId: string;
  photoUrl: string;
  photoType: 'BEFORE' | 'DURING' | 'AFTER';
  description?: string;
}

export interface WorkOrderStatusEvent {
  id: string;
  fromStatus?: string;
  toStatus: string;
  changedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface WorkOrderStats {
  DRAFT: number;
  OPEN: number;
  DIAGNOSING: number;
  PENDING_APPROVAL: number;
  IN_REPAIR: number;
  COMPLETED: number;
  INVOICED: number;
  DELIVERED: number;
  CANCELLED: number;
}

export const workOrderApi = {
  getAll: (
    token: string,
    params?: {
      status?: string;
      technicianId?: string;
      clientId?: string;
      vehicleId?: string;
      limit?: number;
      offset?: number;
    }
  ) => {
    const qs = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return apiRequest<{ data: WorkOrder[] }>(`/api/work-orders${qs}`, { token });
  },

  getStats: (token: string) =>
    apiRequest<{ data: WorkOrderStats }>('/api/work-orders/stats', { token }),

  getById: (id: string, token: string) =>
    apiRequest<{ data: WorkOrder }>(`/api/work-orders/${id}`, { token }),

  create: (data: Partial<WorkOrder>, token: string) =>
    apiRequest<{ data: WorkOrder }>('/api/work-orders', { method: 'POST', body: data, token }),

  update: (id: string, data: Partial<WorkOrder>, token: string) =>
    apiRequest<{ data: WorkOrder }>(`/api/work-orders/${id}`, { method: 'PUT', body: data, token }),

  changeStatus: (id: string, status: string, notes: string, token: string) =>
    apiRequest<{ data: WorkOrder }>(`/api/work-orders/${id}/status`, {
      method: 'POST',
      body: { status, notes },
      token,
    }),

  addLaborLine: (id: string, data: Partial<WorkOrderLaborLine>, token: string) =>
    apiRequest<{ data: WorkOrderLaborLine }>(`/api/work-orders/${id}/labor`, {
      method: 'POST',
      body: data,
      token,
    }),

  updateLaborLine: (id: string, lineId: string, data: Partial<WorkOrderLaborLine>, token: string) =>
    apiRequest<{ data: WorkOrderLaborLine }>(`/api/work-orders/${id}/labor/${lineId}`, {
      method: 'PUT',
      body: data,
      token,
    }),

  deleteLaborLine: (id: string, lineId: string, token: string) =>
    apiRequest<void>(`/api/work-orders/${id}/labor/${lineId}`, { method: 'DELETE', token }),

  addPartLine: (id: string, data: Partial<WorkOrderPartLine>, token: string) =>
    apiRequest<{ data: WorkOrderPartLine }>(`/api/work-orders/${id}/parts`, {
      method: 'POST',
      body: data,
      token,
    }),

  updatePartLine: (id: string, lineId: string, data: Partial<WorkOrderPartLine>, token: string) =>
    apiRequest<{ data: WorkOrderPartLine }>(`/api/work-orders/${id}/parts/${lineId}`, {
      method: 'PUT',
      body: data,
      token,
    }),

  deletePartLine: (id: string, lineId: string, token: string) =>
    apiRequest<void>(`/api/work-orders/${id}/parts/${lineId}`, { method: 'DELETE', token }),

  addPhoto: (
    id: string,
    data: { photoUrl: string; photoType: string; description?: string },
    token: string
  ) =>
    apiRequest<{ data: WorkOrderPhoto }>(`/api/work-orders/${id}/photos`, {
      method: 'POST',
      body: data,
      token,
    }),

  deletePhoto: (id: string, photoId: string, token: string) =>
    apiRequest<void>(`/api/work-orders/${id}/photos/${photoId}`, { method: 'DELETE', token }),

  getVehicleHistory: (vehicleId: string, token: string) =>
    apiRequest<{ data: WorkOrder[] }>(`/api/vehicles/${vehicleId}/work-order-history`, { token }),

  getClientHistory: (clientId: string, token: string) =>
    apiRequest<{ data: WorkOrder[] }>(`/api/clients/${clientId}/work-order-history`, { token }),

  addService: (
    id: string,
    data: { serviceId?: string; serviceTypeId?: string; name?: string; description?: string; basePrice?: number },
    token: string
  ) =>
    apiRequest<{ data: WorkOrderService; message: string }>(`/api/work-orders/${id}/services`, {
      method: 'POST',
      body: data,
      token,
    }),

  removeService: (id: string, serviceId: string, token: string) =>
    apiRequest<{ data: WorkOrderService; message: string }>(`/api/work-orders/${id}/services/${serviceId}`, {
      method: 'DELETE',
      token,
    }),
};

export { ApiError };
