/**
 * Custom hooks for API data fetching
 * Works with the microservices API client
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  vehicleApi, 
  serviceApi, 
  reservationApi, 
  paymentApi, 
  notificationApi,
  jobApi,
  washerApi,
  Vehicle, 
  Service, 
  Reservation, 
  Payment, 
  Notification,
  ApiError
} from '@/lib/api-client';

interface UseApiResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Generic hook for API calls
function useApiCall<T>(
  apiCall: (token: string) => Promise<T>,
  dependencies: unknown[] = []
): UseApiResult<T> {
  const { token } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiCall(token);
      setData(result);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, apiCall]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  return { data, isLoading, error, refetch: fetchData };
}

// Vehicles hook
export function useVehicles(): UseApiResult<Vehicle[]> {
  return useApiCall((token) => vehicleApi.getAll(token));
}

// Services hook
export function useServices(vehicleType?: string): UseApiResult<Service[]> {
  return useApiCall(
    (token) => serviceApi.getAll(token, vehicleType),
    [vehicleType]
  );
}

// Reservations hook
export function useReservations(status?: string): UseApiResult<Reservation[]> {
  return useApiCall(
    (token) => reservationApi.getAll(token, status),
    [status]
  );
}

// Single reservation hook
export function useReservation(id: string): UseApiResult<Reservation> {
  return useApiCall(
    (token) => reservationApi.getById(id, token),
    [id]
  );
}

// Reservation stats hook
export function useReservationStats() {
  return useApiCall((token) => reservationApi.getStats(token));
}

// Payments hook
export function usePayments(): UseApiResult<Payment[]> {
  return useApiCall((token) => paymentApi.getAll(token));
}

// Notifications hook
export function useNotifications(unreadOnly = false): UseApiResult<Notification[]> {
  return useApiCall(
    (token) => notificationApi.getAll(token, unreadOnly),
    [unreadOnly]
  );
}

// Unread notification count hook
export function useUnreadNotificationCount() {
  return useApiCall((token) => notificationApi.getUnreadCount(token));
}

// Available jobs hook (for washers)
export function useAvailableJobs(): UseApiResult<Reservation[]> {
  return useApiCall((token) => jobApi.getAvailable(token));
}

// Washer's jobs hook
export function useWasherJobs(status?: string): UseApiResult<Reservation[]> {
  return useApiCall(
    (token) => jobApi.getMyJobs(token, status),
    [status]
  );
}

// Washers list hook
export function useWashers(available?: boolean): UseApiResult<unknown[]> {
  return useApiCall(
    (token) => washerApi.getAll(token, available),
    [available]
  );
}

// Mutation hooks for actions
export function useCreateReservation() {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReservation = async (data: Parameters<typeof reservationApi.create>[0]) => {
    if (!token) throw new Error('Not authenticated');
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await reservationApi.create(data, token);
      return result;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to create reservation';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { createReservation, isLoading, error };
}

export function useCreateVehicle() {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createVehicle = async (data: Parameters<typeof vehicleApi.create>[0]) => {
    if (!token) throw new Error('Not authenticated');
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await vehicleApi.create(data, token);
      return result;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to create vehicle';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { createVehicle, isLoading, error };
}

export function useJobActions() {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptJob = async (id: string) => {
    if (!token) throw new Error('Not authenticated');
    setIsLoading(true);
    try {
      return await jobApi.accept(id, token);
    } finally {
      setIsLoading(false);
    }
  };

  const startJob = async (id: string) => {
    if (!token) throw new Error('Not authenticated');
    setIsLoading(true);
    try {
      return await jobApi.start(id, token);
    } finally {
      setIsLoading(false);
    }
  };

  const completeJob = async (id: string, proofImages: string[] = []) => {
    if (!token) throw new Error('Not authenticated');
    setIsLoading(true);
    try {
      return await jobApi.complete(id, proofImages, token);
    } finally {
      setIsLoading(false);
    }
  };

  return { acceptJob, startJob, completeJob, isLoading, error };
}
