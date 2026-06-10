'use client';

import Badge from '@/components/ui/Badge';
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_VARIANTS,
  WORK_ORDER_STATUS_LABELS,
  WORK_ORDER_STATUS_VARIANTS,
  PRIORITY_LABELS,
  PRIORITY_VARIANTS,
  type ReservationStatus,
  type WorkOrderStatus,
  type WorkOrderPriority,
} from '@/lib/constants';

type StatusBadgeProps =
  | { type: 'reservation'; status: ReservationStatus }
  | { type: 'workOrder';   status: WorkOrderStatus }
  | { type: 'priority';    status: WorkOrderPriority };

export default function StatusBadge(props: StatusBadgeProps) {
  if (props.type === 'reservation') {
    return (
      <Badge variant={RESERVATION_STATUS_VARIANTS[props.status]}>
        {RESERVATION_STATUS_LABELS[props.status]}
      </Badge>
    );
  }

  if (props.type === 'workOrder') {
    return (
      <Badge variant={WORK_ORDER_STATUS_VARIANTS[props.status]}>
        {WORK_ORDER_STATUS_LABELS[props.status]}
      </Badge>
    );
  }

  return (
    <Badge variant={PRIORITY_VARIANTS[props.status]}>
      {PRIORITY_LABELS[props.status]}
    </Badge>
  );
}
