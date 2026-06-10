'use client';

import Link from 'next/link';
import { Edit, Trash2, DollarSign, Calendar, Clock, User, CheckCircle, Banknote } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { type Reservation, type Payment } from '@/lib/api-client';
import { RESERVATION_STATUS_LABELS, RESERVATION_STATUS_VARIANTS } from '@/lib/constants';

const RESERVATION_STATUS_DESCRIPTIONS: Record<Reservation['status'], string> = {
  PENDING:     'En espera de lavador',
  CONFIRMED:   'Lavador asignado',
  IN_PROGRESS: 'Servicio en progreso',
  COMPLETED:   'Servicio completado',
  CANCELLED:   'Reserva cancelada',
};

interface ReservationCardProps {
  reservation: Reservation;
  payment?: Payment;
  onEdit: (reservation: Reservation) => void;
  onDelete: (id: string, vehicleInfo: string) => void;
}

export default function ReservationCard({ reservation, payment, onEdit, onDelete }: ReservationCardProps) {
  const statusVariant = RESERVATION_STATUS_VARIANTS[reservation.status];
  const statusLabel = RESERVATION_STATUS_LABELS[reservation.status];
  const statusDescription = RESERVATION_STATUS_DESCRIPTIONS[reservation.status];
  const isPaid = payment?.status === 'COMPLETED';
  const isCashPending = payment?.status === 'PENDING' && payment?.paymentMethod === 'CASH';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant={statusVariant} size="md">{statusLabel}</Badge>
            {isPaid && (
              <Badge variant="success" size="md">
                <CheckCircle className="w-3 h-3 mr-1 inline" />
                Pagado
              </Badge>
            )}
            {isCashPending && (
              <Badge variant="warning" size="md">
                <Banknote className="w-3 h-3 mr-1 inline" />
                Pago en efectivo pendiente
              </Badge>
            )}
            {!isPaid && !isCashPending && (
              <span className="text-xs text-slate-500 dark:text-slate-400">{statusDescription}</span>
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {reservation.serviceName || 'Servicio'}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
            ${Number(reservation.totalAmount).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-4 bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
        {reservation.address && (
          <div className="flex items-start gap-3 text-sm">
            <User className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5" />
            <span className="text-slate-600 dark:text-slate-400">{reservation.address}</span>
          </div>
        )}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <span className="text-slate-600 dark:text-slate-400">
              {new Date(reservation.scheduledDate).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">{reservation.scheduledTime}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-cyan-100 dark:border-slate-600">
        <Link href={`/dashboard/pagos/${reservation.id}`} className="flex-1">
          <Button variant={isPaid ? 'ghost' : 'secondary'} fullWidth size="sm">
            {isPaid ? (
              <><CheckCircle className="w-4 h-4 text-green-500" /> Ver comprobante</>
            ) : (
              <><DollarSign className="w-4 h-4" /> {isCashPending ? 'Ver pago' : 'Pagar'}</>
            )}
          </Button>
        </Link>
        {reservation.status === 'PENDING' && (
          <>
            <Button variant="outline" size="sm" onClick={() => onEdit(reservation)} title="Editar reserva">
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(reservation.id, reservation.serviceName ?? '')}
              title="Cancelar reserva"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
