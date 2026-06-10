'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { adminApi, reservationApi, employeeApi, workOrderApi, type WorkOrder, type WorkOrderStats, type Reservation } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import ReservationReportStats from './ReservationReportStats';
import WorkOrderReportSummary from './WorkOrderReportSummary';

/** Reserva con el alias legado `washerId` que algunos reportes consultan. */
type ReservationWithWasher = Reservation & { washerId?: string };

export default function ReportesPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalReservations: 0,
    completedReservations: 0,
    cancelledReservations: 0,
    pendingReservations: 0,
    activeUsers: 0,
    totalWashers: 0,
    topWashers: [] as { washerId: string; washerName: string; count: number; revenue: number }[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [woStats, setWoStats] = useState<WorkOrderStats | null>(null);
  const [woOrders, setWoOrders] = useState<WorkOrder[]>([]);

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    if (token) {
      Promise.all([
        adminApi.getUsers(token),
        reservationApi.getAllReservations(token),
        employeeApi.getAll(token),
      ])
        .then(([users, reservations, washers]) => {
          // Build washer name lookup map (id → name)
          const washerNameMap = new Map<string, string>();
          washers.forEach((washer) => washerNameMap.set(washer.id, washer.name));

          const completed = reservations.filter((reservation) => reservation.status === 'COMPLETED');
          const cancelled = reservations.filter((reservation) => reservation.status === 'CANCELLED');
          const pending = reservations.filter((reservation) => reservation.status === 'PENDING');

          const thisMonth = new Date().getMonth();
          const thisYear = new Date().getFullYear();
          const monthlyCompleted = completed.filter((reservation) => {
            const date = new Date(reservation.completedAt || reservation.createdAt);
            return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
          });

          // Revenue uses totalAmount (the real persisted price per reservation)
          const totalRevenue = completed.reduce(
            (sum, reservation) => sum + (Number(reservation.totalAmount) || 0),
            0
          );
          const monthlyRevenue = monthlyCompleted.reduce(
            (sum, reservation) => sum + (Number(reservation.totalAmount) || 0),
            0
          );

          // Build top washers from completed reservations
          const washerStatsMap = new Map<string, { count: number; revenue: number }>();
          completed.forEach((reservation: ReservationWithWasher) => {
            if (!reservation.washerId) return;
            const current = washerStatsMap.get(reservation.washerId) || { count: 0, revenue: 0 };
            washerStatsMap.set(reservation.washerId, {
              count: current.count + 1,
              revenue: current.revenue + (Number(reservation.totalAmount) || 0),
            });
          });

          const topWashers = Array.from(washerStatsMap.entries())
            .map(([washerId, data]) => ({
              washerId,
              washerName: washerNameMap.get(washerId) || `Lavador (${washerId.slice(-4)})`,
              ...data,
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

          setStats({
            totalRevenue,
            monthlyRevenue,
            totalReservations: reservations.length,
            completedReservations: completed.length,
            cancelledReservations: cancelled.length,
            pendingReservations: pending.length,
            activeUsers: users.filter((u) => u.role !== 'EMPLOYEE').length,
            totalWashers: washers.length,
            topWashers,
          });
        })
        .catch((error) => logger.error('Error cargando reportes', error))
        .finally(() => setIsLoading(false));
    }
  }, [user, token, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'ADMIN' || !token) return;

    Promise.all([
      workOrderApi.getStats(token),
      workOrderApi.getAll(token, { limit: 100 }),
    ])
      .then(([statsRes, ordersRes]) => {
        setWoStats(statsRes.data);
        setWoOrders(ordersRes.data);
      })
      .catch((error) => logger.error('Error cargando órdenes de trabajo', error));
  }, [user, token, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  const completionRate = stats.totalReservations > 0
    ? Math.round((stats.completedReservations / stats.totalReservations) * 100)
    : 0;

  const avgTicket = stats.completedReservations > 0
    ? Math.round(stats.totalRevenue / stats.completedReservations)
    : 0;

  const dayOfMonth = new Date().getDate();
  const monthlyProjection = dayOfMonth > 0
    ? Math.round(stats.monthlyRevenue * (30 / dayOfMonth))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reportes y Analíticas</h1>
        <p className="text-slate-600 dark:text-slate-400">Estadísticas y métricas del negocio</p>
      </div>

      <ReservationReportStats
        stats={stats}
        completionRate={completionRate}
        avgTicket={avgTicket}
        monthlyProjection={monthlyProjection}
        dayOfMonth={dayOfMonth}
      />

      <WorkOrderReportSummary woStats={woStats} woOrders={woOrders} />
    </div>
  );
}
