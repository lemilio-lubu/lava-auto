'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  highlightedDates?: Date[];
  className?: string;
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function Calendar({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  disabledDates = [],
  highlightedDates = [],
  className = '',
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate ? selectedDate.getMonth() : new Date().getMonth()
  );
  const [currentYear, setCurrentYear] = useState(
    selectedDate ? selectedDate.getFullYear() : new Date().getFullYear()
  );

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentMonth, currentYear]);

  const firstDayOfMonth = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentMonth, currentYear]);

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return disabledDates.some(
      (d) => d.toDateString() === date.toDateString()
    );
  };

  const isDateHighlighted = (date: Date) => {
    return highlightedDates.some(
      (d) => d.toDateString() === date.toDateString()
    );
  };

  const isDateSelected = (date: Date) => {
    return selectedDate?.toDateString() === date.toDateString();
  };

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    if (!isDateDisabled(date)) {
      onDateSelect(date);
    }
  };

  const renderDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square" />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const disabled = isDateDisabled(date);
      const highlighted = isDateHighlighted(date);
      const selected = isDateSelected(date);
      const today = isToday(date);

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={disabled}
          className={`
            aspect-square rounded-lg text-sm font-medium
            transition-all duration-200
            ${disabled
              ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
              : 'hover:bg-cyan-100 dark:hover:bg-cyan-900/30 cursor-pointer'
            }
            ${selected
              ? 'bg-cyan-600 dark:bg-cyan-500 text-white hover:bg-cyan-700 dark:hover:bg-cyan-600 shadow-md'
              : ''
            }
            ${today && !selected
              ? 'border-2 border-cyan-600 dark:border-cyan-400 text-cyan-600 dark:text-cyan-400 font-bold'
              : ''
            }
            ${highlighted && !selected && !disabled
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              : ''
            }
            ${!selected && !today && !highlighted && !disabled
              ? 'text-slate-700 dark:text-slate-300'
              : ''
            }
          `}
          aria-label={`Seleccionar ${day} de ${MONTHS[currentMonth]}`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg dark:shadow-slate-900/50 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePreviousMonth}
          className="p-2 rounded-lg hover:bg-cyan-50 dark:hover:bg-slate-700 text-cyan-600 dark:text-cyan-400 transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {MONTHS[currentMonth]} {currentYear}
        </h2>

        <button
          onClick={handleNextMonth}
          className="p-2 rounded-lg hover:bg-cyan-50 dark:hover:bg-slate-700 text-cyan-600 dark:text-cyan-400 transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-cyan-100 dark:border-slate-700 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2 border-cyan-600 dark:border-cyan-400"></div>
          <span className="text-slate-600 dark:text-slate-400">Hoy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-cyan-600 dark:bg-cyan-500"></div>
          <span className="text-slate-600 dark:text-slate-400">Seleccionado</span>
        </div>
        {highlightedDates.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-900/30"></div>
            <span className="text-slate-600 dark:text-slate-400">Con reservas</span>
          </div>
        )}
      </div>
    </div>
  );
}
