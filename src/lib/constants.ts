/**
 * constants.ts — Constantes compartidas del frontend.
 *
 * Centraliza labels, variantes de Badge y configuración de UI para
 * evitar la duplicación de estos mapas en cada página/componente.
 */

import type { Reservation, WorkOrder } from '@/lib/api-client';

export type ReservationStatus = Reservation['status'];
export type WorkOrderStatus = WorkOrder['status'];
export type WorkOrderPriority = WorkOrder['priority'];
export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

// ─── Reservas ─────────────────────────────────────────────────────────────────

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING:     'Pendiente',
  CONFIRMED:   'Agendado',
  IN_PROGRESS: 'En curso',
  COMPLETED:   'Finalizado',
  CANCELLED:   'Cancelada',
};

export const RESERVATION_STATUS_VARIANTS: Record<ReservationStatus, BadgeVariant> = {
  PENDING:     'warning',
  CONFIRMED:   'info',
  IN_PROGRESS: 'primary',
  COMPLETED:   'success',
  CANCELLED:   'error',
};

// ─── Órdenes de trabajo ───────────────────────────────────────────────────────

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  DRAFT:            'Borrador',
  OPEN:             'Abierta',
  DIAGNOSING:       'Diagnóstico',
  PENDING_APPROVAL: 'Pend. Aprobación',
  IN_REPAIR:        'En Reparación',
  COMPLETED:        'Completada',
  INVOICED:         'Facturada',
  DELIVERED:        'Entregada',
  CANCELLED:        'Cancelada',
};

export const WORK_ORDER_STATUS_VARIANTS: Record<WorkOrderStatus, BadgeVariant> = {
  DRAFT:            'neutral',
  OPEN:             'info',
  DIAGNOSING:       'warning',
  PENDING_APPROVAL: 'warning',
  IN_REPAIR:        'primary',
  COMPLETED:        'success',
  INVOICED:         'success',
  DELIVERED:        'success',
  CANCELLED:        'error',
};

// ─── Prioridades ──────────────────────────────────────────────────────────────

export const PRIORITY_LABELS: Record<WorkOrderPriority, string> = {
  LOW:    'Baja',
  NORMAL: 'Normal',
  HIGH:   'Alta',
  URGENT: 'Urgente',
};

export const PRIORITY_VARIANTS: Record<WorkOrderPriority, BadgeVariant> = {
  LOW:    'neutral',
  NORMAL: 'info',
  HIGH:   'warning',
  URGENT: 'error',
};
