import Link from 'next/link';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { 
  Wrench, 
  Droplets, 
  PaintBucket, 
  CarFront, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2,
  Settings,
  ChevronRight,
  ChevronDown,
  Sparkles,
  User
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#000000] text-slate-900 dark:text-white font-sans selection:bg-blue-500/30 overflow-x-hidden transition-colors duration-300">
      {/* Navbar - Apple Style (Glassmorphism) */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-black/50 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <Settings className="h-7 w-7 text-slate-900 dark:text-white group-hover:rotate-90 transition-transform duration-700 ease-in-out" strokeWidth={2.5} />
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Taller Nexus
            </span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-6 text-sm font-medium">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:block text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              Iniciar Sesión
            </Link>
            <Link href="/register" className="hidden sm:block bg-slate-900 dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-full hover:scale-105 transition-transform duration-300 shadow-sm dark:shadow-none">
              Registrarse
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation (PWA Native Feel) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/10 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around p-3">
          <Link href="/login" className="flex flex-col items-center gap-1 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Ingresar</span>
          </Link>
          <Link href="/register" className="flex items-center justify-center px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full font-medium text-sm shadow-lg hover:scale-105 transition-transform">
            Agendar Cita
          </Link>
        </div>
      </div>

      {/* Hero Section - Cinematic & Minimalist */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Abstract Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center pb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 text-slate-600 dark:text-gray-300 text-sm font-medium mb-8 backdrop-blur-md hover:bg-slate-900/10 dark:hover:bg-white/10 transition-colors cursor-default">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>La evolución del cuidado automotriz</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tighter mb-6 leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-slate-900 via-slate-800 to-slate-500 dark:from-white dark:via-white dark:to-gray-500">
            Tu auto.<br />
            Nuestra obra maestra.
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-slate-600 dark:text-gray-400 mb-12 max-w-2xl font-light leading-relaxed">
            Mecánica de precisión, estética impecable y tecnología de punta. Todo gestionado desde la palma de tu mano.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center mt-4 w-full sm:w-auto px-4 sm:px-0">
            <Link href="/register" className="w-full sm:w-auto group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white dark:text-black bg-slate-900 dark:bg-white rounded-full overflow-hidden transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl dark:shadow-none dark:hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]">
              <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 dark:from-white dark:via-gray-200 dark:to-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
              <span className="relative flex items-center gap-2">
                Agendar Cita <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Link>
            
            <Link href="/dashboard/client" className="w-full sm:w-auto group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-slate-900 dark:text-white bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-full overflow-hidden backdrop-blur-md transition-all duration-300 hover:bg-slate-900/10 dark:hover:bg-white/10 hover:border-slate-900/20 dark:hover:border-white/20 hover:scale-105">
              <span className="relative flex items-center gap-2">
                Cotizar Choque <ArrowRight className="h-5 w-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
              </span>
            </Link>
          </div>
        </div>

        {/* Scroll Indicator - Apple Style */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-60 hover:opacity-100 transition-opacity duration-300 cursor-pointer hidden sm:flex">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-500 dark:text-gray-400">Descubre más</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-slate-400 to-transparent dark:from-gray-500 dark:to-transparent animate-pulse"></div>
        </div>
      </section>

      {/* Services Grid - Bento Box Style (Apple Inspired) */}
      <section className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-slate-900 dark:text-white">Servicios de élite.</h2>
            <p className="text-xl text-slate-600 dark:text-gray-400 max-w-2xl mx-auto font-light">
              Diseñados para superar expectativas. Ejecutados con precisión milimétrica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[400px]">
            {/* Large Bento Item */}
            <div className="md:col-span-2 relative rounded-[2.5rem] bg-white dark:bg-gradient-to-br dark:from-zinc-900 dark:to-black border border-slate-200 dark:border-white/10 p-10 overflow-hidden group hover:border-slate-300 dark:hover:border-white/20 transition-colors duration-500 shadow-sm hover:shadow-md dark:shadow-none">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-5 dark:opacity-20 group-hover:opacity-10 dark:group-hover:opacity-30 group-hover:scale-105 transition-all duration-700"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 dark:from-black dark:via-black/50 to-transparent"></div>
              
              <div className="relative z-10 h-full flex flex-col justify-end">
                <div className="bg-slate-100 dark:bg-white/10 backdrop-blur-md w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-slate-200 dark:border-white/10">
                  <Wrench className="h-7 w-7 text-slate-900 dark:text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-3 text-slate-900 dark:text-white">Mecánica Avanzada</h3>
                <p className="text-slate-600 dark:text-gray-400 text-lg max-w-md leading-relaxed">
                  Diagnóstico computarizado, mantenimiento preventivo y reparación de motores con repuestos originales garantizados.
                </p>
              </div>
            </div>

            {/* Small Bento Item 1 */}
            <div className="relative rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 p-10 overflow-hidden group hover:border-slate-300 dark:hover:border-white/20 transition-colors duration-500 flex flex-col justify-between shadow-sm hover:shadow-md dark:shadow-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100 dark:bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-200 dark:group-hover:bg-purple-500/20 transition-colors duration-500"></div>
              <div className="relative z-10">
                <div className="bg-purple-100 dark:bg-purple-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-purple-200 dark:border-purple-500/30">
                  <PaintBucket className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Pintura Premium</h3>
                <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
                  Restauración de color, pintura al horno y corrección de imperfecciones.
                </p>
              </div>
            </div>

            {/* Small Bento Item 2 */}
            <div className="relative rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 p-10 overflow-hidden group hover:border-slate-300 dark:hover:border-white/20 transition-colors duration-500 flex flex-col justify-between shadow-sm hover:shadow-md dark:shadow-none">
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-100 dark:bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-200 dark:group-hover:bg-cyan-500/20 transition-colors duration-500"></div>
              <div className="relative z-10">
                <div className="bg-cyan-100 dark:bg-cyan-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-cyan-200 dark:border-cyan-500/30">
                  <CarFront className="h-7 w-7 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Estética Automotriz</h3>
                <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
                  Detallado interior y exterior, recubrimiento cerámico y corrección de pintura.
                </p>
              </div>
            </div>

            {/* Medium Bento Item */}
            <div className="md:col-span-2 relative rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 p-10 overflow-hidden group hover:border-slate-300 dark:hover:border-white/20 transition-colors duration-500 flex items-center shadow-sm hover:shadow-md dark:shadow-none">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full bg-gradient-to-l from-orange-100 dark:from-orange-500/10 to-transparent blur-2xl"></div>
              <div className="relative z-10 max-w-md">
                <div className="bg-orange-100 dark:bg-orange-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-orange-200 dark:border-orange-500/30">
                  <ShieldCheck className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-3xl font-bold mb-3 text-slate-900 dark:text-white">Cotización Inteligente</h3>
                <p className="text-slate-600 dark:text-gray-400 text-lg leading-relaxed mb-6">
                  ¿Tuviste un siniestro? Sube fotos de los daños y recibe un presupuesto detallado y transparente en tiempo récord.
                </p>
                <Link href="/dashboard/client" className="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400 font-medium hover:text-orange-700 dark:hover:text-orange-300 transition-colors">
                  Iniciar cotización <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive UI Showcase Section */}
      <section className="py-32 relative overflow-hidden border-t border-slate-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            
            {/* Text Content */}
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight leading-tight text-slate-900 dark:text-white">
                Transparencia total.<br />
                <span className="text-slate-500 dark:text-gray-500">En tiempo real.</span>
              </h2>
              <p className="text-xl text-slate-600 dark:text-gray-400 mb-10 font-light leading-relaxed">
                Sigue el progreso de tu vehículo paso a paso. Aprueba presupuestos, comunícate con tu mecánico y paga desde la app. La experiencia del taller, reinventada.
              </p>
              
              <div className="space-y-8">
                {[
                  { title: 'Historial Digital', desc: 'Todo el mantenimiento de tu auto en un solo lugar.' },
                  { title: 'Aprobación a un clic', desc: 'Sin sorpresas. Tú decides qué reparaciones autorizar.' },
                  { title: 'Notificaciones Push', desc: 'Te avisamos cuando tu auto esté listo para recoger.' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="mt-1 bg-slate-100 dark:bg-white/5 p-2 rounded-full border border-slate-200 dark:border-white/10 group-hover:bg-slate-200 dark:group-hover:bg-white/10 transition-all">
                      <CheckCircle2 className="h-5 w-5 text-slate-900 dark:text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{item.title}</h4>
                      <p className="text-slate-600 dark:text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Glassmorphism UI Mockup */}
            <div className="relative lg:h-[600px] flex items-center justify-center perspective-1000">
              {/* Glow behind mockup */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 dark:from-blue-600/20 to-purple-400/20 dark:to-purple-600/20 blur-[100px] rounded-full"></div>
              
              {/* Floating UI Card */}
              <div className="relative w-full max-w-md bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700 ease-out">
                
                {/* Mockup Header */}
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-800 dark:to-gray-900 p-3 rounded-2xl border border-slate-300 dark:border-white/5 shadow-inner">
                      <CarFront className="h-8 w-8 text-slate-900 dark:text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">Audi Q5</h4>
                      <p className="text-slate-500 dark:text-gray-400 text-sm">Servicio Solicitado</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    En Proceso
                  </div>
                </div>
                
                {/* Mockup Progress Steps - Simplified for Single Service */}
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-300 dark:before:from-white/20 before:to-transparent">
                  
                  {/* Step 1: Done */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-xs shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      ✓
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm">
                      <div className="flex justify-between items-center mb-1">
                        <h5 className="font-semibold text-slate-900 dark:text-white text-sm">Solicitud Recibida</h5>
                        <span className="text-xs text-slate-500 dark:text-gray-500">09:00 AM</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-gray-400">Taller asignado.</p>
                    </div>
                  </div>

                  {/* Step 2: Active */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-blue-500 bg-white dark:bg-black text-blue-500 font-bold text-xs shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 shadow-[0_0_15px_rgba(59,130,246,0.3)] dark:shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 backdrop-blur-sm">
                      <div className="flex justify-between items-center mb-1">
                        <h5 className="font-semibold text-slate-900 dark:text-white text-sm">Servicio en Curso</h5>
                        <span className="text-xs text-blue-600 dark:text-blue-400">Ahora</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-gray-300">Mantenimiento en ejecución.</p>
                    </div>
                  </div>

                  {/* Step 3: Pending */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-black text-slate-400 dark:text-white/50 font-bold text-xs shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      3
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 backdrop-blur-sm opacity-50">
                      <h5 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">Finalizado</h5>
                      <p className="text-xs text-slate-500 dark:text-gray-400">Pendiente de entrega</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Minimalist */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-100 dark:to-blue-900/20"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tighter text-slate-900 dark:text-white">
            El futuro de tu auto<br />
            <span className="text-slate-500 dark:text-gray-500">comienza aquí.</span>
          </h2>
          <div className="mt-12 flex justify-center">
            <Link href="/register" className="group relative inline-flex items-center justify-center px-10 py-5 text-xl font-medium text-white dark:text-black bg-slate-900 dark:bg-white rounded-full overflow-hidden transition-all hover:scale-105 shadow-xl dark:shadow-none">
              <span className="relative flex items-center gap-2">
                Crear cuenta gratis <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer - Clean & Apple Style */}
      <footer className="border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black pt-20 pb-24 sm:pb-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Section: Brand & Links */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-16">
            {/* Brand (Takes up more space on desktop) */}
            <div className="md:col-span-5 flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3">
                <Settings className="h-7 w-7 text-slate-900 dark:text-white" strokeWidth={2.5} />
                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Taller Nexus
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-gray-400 text-center md:text-left max-w-xs leading-relaxed">
                La evolución del cuidado automotriz. Precisión, estética y tecnología en un solo lugar.
              </p>
            </div>

            {/* Navigation Links (Centered) */}
            <div className="md:col-span-3 flex flex-col items-center md:items-start gap-4">
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-900 dark:text-white">Plataforma</span>
              <div className="flex flex-col items-center md:items-start gap-3 text-sm text-slate-500 dark:text-gray-400">
                <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Servicios</Link>
                <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Cotizar Choque</Link>
                <Link href="/login" className="hover:text-slate-900 dark:hover:text-white transition-colors">Iniciar Sesión</Link>
              </div>
            </div>

            {/* Elaborado por (Right aligned) */}
            <div className="md:col-span-4 flex flex-col items-center md:items-end gap-4">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400 dark:text-gray-500">
                Elaborado por
              </span>
              <a 
                href="#" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group relative h-20 w-48 flex items-center justify-center md:justify-end"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-slate-400/10 dark:bg-white/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                
                {/* Logo container with smooth scale and slight lift */}
                <div className="relative h-full w-full opacity-70 group-hover:opacity-100 group-hover:scale-105 group-hover:-translate-y-0.5 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
                  {/* Logo para modo claro (logo oscuro) */}
                  <img 
                    src="/Exodo_logo_dark.svg" 
                    alt="Exodo Logo" 
                    className="h-full w-full object-contain object-center md:object-right dark:hidden drop-shadow-sm" 
                  />
                  {/* Logo para modo oscuro (logo claro) */}
                  <img 
                    src="/Exodo_logo_light.svg" 
                    alt="Exodo Logo" 
                    className="h-full w-full object-contain object-center md:object-right hidden dark:block drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                  />
                </div>
              </a>
            </div>
          </div>

          {/* Bottom Section: Legal & Copyright */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-400 dark:text-gray-600 border-t border-slate-200 dark:border-white/10 pt-8">
            <p>© {new Date().getFullYear()} Taller Nexus Inc. Todos los derechos reservados.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-slate-600 dark:hover:text-gray-300 transition-colors">Política de Privacidad</Link>
              <Link href="#" className="hover:text-slate-600 dark:hover:text-gray-300 transition-colors">Términos de Servicio</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
