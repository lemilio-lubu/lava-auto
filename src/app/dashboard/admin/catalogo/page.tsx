'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  Loader2, Tag, Layers, Flame, Package, Wrench,
  ClipboardList, Clock, Star, Percent, Hash, ChevronRight
} from 'lucide-react';

const CATALOG_CARDS = [
  {
    icon: Tag,
    label: 'Marcas',
    description: 'Marcas de vehículos',
    href: '/dashboard/admin/catalogo/marcas',
  },
  {
    icon: Layers,
    label: 'Modelos',
    description: 'Modelos por marca',
    href: '/dashboard/admin/catalogo/modelos',
  },
  {
    icon: Flame,
    label: 'Combustibles',
    description: 'Tipos de combustible',
    href: '/dashboard/admin/catalogo/combustibles',
  },
  {
    icon: Package,
    label: 'Categorías de Repuestos',
    description: 'Categorías de inventario',
    href: '/dashboard/admin/catalogo/categorias-repuestos',
  },
  {
    icon: Wrench,
    label: 'Repuestos',
    description: 'Piezas y materiales',
    href: '/dashboard/admin/catalogo/repuestos',
  },
  {
    icon: ClipboardList,
    label: 'Tipos de Servicio',
    description: 'Servicios del taller',
    href: '/dashboard/admin/catalogo/tipos-servicio',
  },
  {
    icon: Clock,
    label: 'Tarifas de Mano de Obra',
    description: 'Tarifas por hora',
    href: '/dashboard/admin/catalogo/tarifas-mano-obra',
  },
  {
    icon: Star,
    label: 'Especialidades',
    description: 'Especialidades técnicas',
    href: '/dashboard/admin/catalogo/especialidades',
  },
  {
    icon: Percent,
    label: 'Impuestos',
    description: 'Tasas de impuesto',
    href: '/dashboard/admin/catalogo/impuestos',
  },
  {
    icon: Hash,
    label: 'Numeración',
    description: 'Config. numeración OT',
    href: '/dashboard/admin/catalogo/numeracion',
  },
];

export default function CatalogoAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Catálogos del Sistema</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Administra los parámetros del taller
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {CATALOG_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all duration-200 group flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/40 transition-colors">
                  <Icon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition-colors" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{card.label}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{card.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
