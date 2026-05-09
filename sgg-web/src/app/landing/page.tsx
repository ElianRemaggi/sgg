'use client'

import { useEffect, useRef, useState } from 'react'
import { Anton, Outfit } from 'next/font/google'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Users,
  TrendingUp,
  Calendar,
  Shield,
  Building2,
  ArrowRight,
  CheckCircle,
  Menu,
  X,
  ChevronRight,
  Dumbbell,
} from 'lucide-react'

const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const features = [
  {
    icon: Users,
    color: 'primary',
    title: 'Gestión de Miembros',
    desc: 'Alta, baja y seguimiento de cada miembro. Membresías, estados e historial completo en un solo lugar.',
  },
  {
    icon: Dumbbell,
    color: 'tertiary',
    title: 'Rutinas Personalizadas',
    desc: 'Creá plantillas de entrenamiento y asignalas a tus miembros en segundos. Del coach directo al miembro.',
  },
  {
    icon: TrendingUp,
    color: 'cyan',
    title: 'Seguimiento de Progreso',
    desc: 'Cada ejercicio completado queda registrado. Métricas reales de adherencia con historial completo.',
  },
  {
    icon: Calendar,
    color: 'primary',
    title: 'Horarios y Clases',
    desc: 'Gestioná clases grupales, turnos y disponibilidad de coaches con un calendario integrado.',
  },
  {
    icon: Shield,
    color: 'tertiary',
    title: 'Roles y Permisos',
    desc: 'Admin, Coach y Miembro con accesos diferenciados. Cada uno ve y hace solo lo que necesita.',
  },
  {
    icon: Building2,
    color: 'cyan',
    title: 'Multi-Sede',
    desc: 'Gestioná múltiples sucursales desde un único panel. Datos separados, visión unificada.',
  },
]

const pillars = [
  { label: '3 roles', sub: 'Admin · Coach · Miembro' },
  { label: 'Multi-sede', sub: 'Una cuenta, varios gyms' },
  { label: 'Tiempo real', sub: 'Datos actualizados al instante' },
  { label: 'Beta gratuita', sub: 'Sin costo durante el lanzamiento' },
]

const roles = [
  {
    name: 'Administrador',
    tag: 'ADMIN',
    colorVar: 'var(--primary-color)',
    bgVar: 'var(--primary-bg)',
    borderVar: 'var(--primary-border)',
    desc: 'Control total del gimnasio. Desde gestión de miembros hasta métricas, todo en tus manos.',
    perks: [
      'Panel de control completo',
      'Gestión de miembros y membresías',
      'Gestión de coaches',
      'Métricas de adherencia',
      'Configuración del gimnasio',
      'Aprobación de nuevos miembros',
    ],
  },
  {
    name: 'Coach',
    tag: 'COACH',
    colorVar: 'var(--tertiary-color)',
    bgVar: 'var(--tertiary-bg)',
    borderVar: 'var(--tertiary-border)',
    desc: 'Diseñá y asigná rutinas personalizadas, hacé seguimiento del progreso y gestioná horarios.',
    perks: [
      'Crear plantillas de rutinas',
      'Asignar entrenamientos a miembros',
      'Ver progreso de sus miembros',
      'Gestionar horarios de clases',
      'Historial de ejercicios completados',
      'Vista de miembros asignados',
    ],
  },
  {
    name: 'Miembro',
    tag: 'MEMBER',
    colorVar: 'var(--cyan-color)',
    bgVar: 'var(--cyan-bg)',
    borderVar: 'var(--cyan-border)',
    desc: 'Accedé a tu rutina, registrá tus entrenamientos y seguí tu evolución. Simple y motivador.',
    perks: [
      'Ver rutina asignada',
      'Registrar ejercicios completados',
      'Historial personal de progreso',
      'Ver horarios de clases',
      'Perfil editable',
      'Estadísticas de adherencia',
    ],
  },
]

const steps = [
  {
    num: '01',
    title: 'Creá tu Gimnasio',
    desc: 'Registrate, configurá tu gimnasio y personalizalo en minutos. Sin tarjeta de crédito.',
  },
  {
    num: '02',
    title: 'Sumá tu Equipo',
    desc: 'Invitá coaches, aprobá miembros y asigná roles. Cada persona accede con su perfil y sus permisos.',
  },
  {
    num: '03',
    title: 'Gestioná Todo',
    desc: 'Rutinas, horarios, seguimiento y métricas desde un solo panel. Tu gimnasio, bajo control.',
  },
]

const featureColors = {
  primary: {
    iconBg: 'rgba(184,180,255,0.08)',
    iconBorder: 'rgba(184,180,255,0.18)',
    iconColor: 'hsl(241 100% 88%)',
  },
  tertiary: {
    iconBg: 'rgba(53,232,132,0.08)',
    iconBorder: 'rgba(53,232,132,0.18)',
    iconColor: 'hsl(157 78% 52%)',
  },
  cyan: {
    iconBg: 'rgba(0,245,255,0.08)',
    iconBorder: 'rgba(0,245,255,0.18)',
    iconColor: 'hsl(190 100% 50%)',
  },
}

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [activeRole, setActiveRole] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.from('[data-anim="hero-badge"]', {
        y: 20, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.1,
      })
      gsap.from('[data-anim="hero-line"]', {
        y: 130, opacity: 0, duration: 1.1, stagger: 0.1, ease: 'power4.out', delay: 0.25,
      })
      gsap.from('[data-anim="hero-sub"]', {
        y: 30, opacity: 0, duration: 0.9, delay: 0.6, ease: 'power3.out',
      })
      gsap.from('[data-anim="hero-cta"]', {
        y: 20, opacity: 0, duration: 0.8, delay: 0.78, ease: 'power3.out',
      })
      gsap.from('[data-anim="float-card"]', {
        y: 60, opacity: 0, duration: 1.1, stagger: 0.18, delay: 0.95, ease: 'back.out(1.4)',
      })
      gsap.to('[data-anim="orb-1"]', {
        scrollTrigger: { trigger: '[data-section="hero"]', scrub: 2 },
        y: -220, ease: 'none',
      })
      gsap.to('[data-anim="orb-2"]', {
        scrollTrigger: { trigger: '[data-section="hero"]', scrub: 3.5 },
        y: -100, x: 40, ease: 'none',
      })
      gsap.from('[data-anim="pillar"]', {
        scrollTrigger: { trigger: '[data-section="pillars"]', start: 'top 78%' },
        y: 40, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out',
      })
      gsap.from('[data-anim="feature-card"]', {
        scrollTrigger: { trigger: '[data-section="features"]', start: 'top 68%' },
        y: 70, opacity: 0, duration: 0.7, stagger: { amount: 0.55 }, ease: 'power3.out',
      })
      gsap.utils.toArray<Element>('[data-anim="section-title"]').forEach((el) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: 'top 87%' },
          y: 45, opacity: 0, duration: 0.95, ease: 'power3.out',
        })
      })
      gsap.from('[data-anim="roles-content"]', {
        scrollTrigger: { trigger: '[data-section="roles"]', start: 'top 68%' },
        y: 55, opacity: 0, duration: 0.9, ease: 'power3.out',
      })
      gsap.from('[data-anim="step"]', {
        scrollTrigger: { trigger: '[data-section="steps"]', start: 'top 68%' },
        x: -60, opacity: 0, duration: 0.85, stagger: 0.18, ease: 'power3.out',
      })
      gsap.from('[data-anim="cta-content"]', {
        scrollTrigger: { trigger: '[data-section="cta"]', start: 'top 75%' },
        y: 55, opacity: 0, duration: 1, ease: 'power3.out',
      })
      ScrollTrigger.create({
        start: 'top -60',
        onUpdate: (self) => {
          const nav = document.querySelector('[data-anim="nav"]') as HTMLElement | null
          if (!nav) return
          if (self.scroll() > 60) {
            nav.style.background = 'rgba(16,19,32,0.92)'
            nav.style.borderBottom = '1px solid rgba(184,180,255,0.1)'
            nav.style.backdropFilter = 'blur(20px)'
          } else {
            nav.style.background = 'transparent'
            nav.style.borderBottom = '1px solid transparent'
            nav.style.backdropFilter = 'none'
          }
        },
      })
    }, rootRef)

    return () => ctx.revert()
  }, [])

  const role = roles[activeRole]

  return (
    <div
      ref={rootRef}
      className={`${anton.variable} ${outfit.variable} overflow-x-hidden min-h-screen`}
      style={{
        background: 'hsl(222 26% 9%)',
        color: 'hsl(234 20% 92%)',
        fontFamily: 'var(--font-body, Outfit, sans-serif)',
        // Color tokens for roles
        '--primary-color': 'hsl(241 100% 88%)',
        '--primary-bg': 'rgba(184,180,255,0.07)',
        '--primary-border': 'rgba(184,180,255,0.22)',
        '--tertiary-color': 'hsl(157 78% 52%)',
        '--tertiary-bg': 'rgba(53,232,132,0.07)',
        '--tertiary-border': 'rgba(53,232,132,0.22)',
        '--cyan-color': 'hsl(190 100% 50%)',
        '--cyan-bg': 'rgba(0,245,255,0.06)',
        '--cyan-border': 'rgba(0,245,255,0.2)',
      } as React.CSSProperties}
    >
      <style>{`
        .font-display { font-family: var(--font-display, Anton, sans-serif); }
        .gradient-primary {
          background: linear-gradient(135deg, hsl(241 100% 88%) 0%, hsl(190 100% 50%) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .gradient-tertiary {
          background: linear-gradient(135deg, hsl(157 78% 52%) 0%, hsl(190 100% 50%) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .bg-grid {
          background-image:
            linear-gradient(rgba(184,180,255,0.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(184,180,255,0.028) 1px, transparent 1px);
          background-size: 64px 64px;
        }
        .card-hover {
          transition: border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
        }
        .card-hover:hover {
          border-color: rgba(184,180,255,0.28) !important;
          transform: translateY(-5px);
          box-shadow: 0 24px 64px rgba(184,180,255,0.06);
        }
        .btn-primary {
          background: linear-gradient(135deg, hsl(241 100% 78%), hsl(241 100% 88%), hsl(241 100% 78%));
          background-size: 200% 100%;
          transition: all 0.35s ease;
          color: hsl(244 100% 20%);
        }
        .btn-primary:hover {
          background-position: right center;
          transform: translateY(-2px);
          box-shadow: 0 14px 44px rgba(184,180,255,0.35);
        }
        .btn-outline {
          border: 1px solid rgba(184,180,255,0.25);
          transition: all 0.3s ease;
          color: hsl(234 20% 78%);
        }
        .btn-outline:hover {
          border-color: hsl(241 100% 88%);
          background: rgba(184,180,255,0.07);
          transform: translateY(-2px);
        }
        @keyframes float-a {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes float-b {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1.5deg); }
        }
        @keyframes float-c {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-9px); }
        }
        .float-a { animation: float-a 6s ease-in-out infinite; }
        .float-b { animation: float-b 8s ease-in-out 0.5s infinite; }
        .float-c { animation: float-c 7s ease-in-out 1.2s infinite; }
      `}</style>

      {/* ─── NAV ─── */}
      <nav
        data-anim="nav"
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ background: 'transparent', borderBottom: '1px solid transparent' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="font-display text-2xl tracking-wider gradient-primary select-none" style={{ fontFamily: 'var(--font-display)' }}>
            SGG
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: 'hsl(247 10% 55%)' }}>
            {[
              { label: 'Funcionalidades', href: '#funcionalidades' },
              { label: 'Roles', href: '#roles' },
              { label: 'Cómo funciona', href: '#como-funciona' },
            ].map((item) => (
              <a key={item.label} href={item.href} className="transition-colors duration-200 hover:text-white">
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <a href="/login" className="text-sm transition-colors hover:text-white" style={{ color: 'hsl(247 10% 55%)' }}>
              Iniciar sesión
            </a>
            <a href="/login" className="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold">
              Empezar gratis
            </a>
          </div>

          <button
            className="md:hidden p-1"
            style={{ color: 'hsl(234 20% 92%)' }}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div
            className="md:hidden px-6 py-6 flex flex-col gap-4"
            style={{ background: 'hsl(222 24% 12%)', borderTop: '1px solid rgba(184,180,255,0.1)' }}
          >
            {[
              { label: 'Funcionalidades', href: '#funcionalidades' },
              { label: 'Roles', href: '#roles' },
              { label: 'Cómo funciona', href: '#como-funciona' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm py-1 transition-colors hover:text-white"
                style={{ color: 'hsl(247 10% 62%)' }}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a href="/login" className="btn-primary px-5 py-3.5 rounded-xl text-sm font-bold text-center mt-2">
              Empezar gratis
            </a>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section data-section="hero" className="relative min-h-screen flex items-center bg-grid overflow-hidden">

        <div
          data-anim="orb-1"
          className="absolute top-1/4 right-1/3 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(184,180,255,0.11) 0%, transparent 68%)', filter: 'blur(80px)' }}
        />
        <div
          data-anim="orb-2"
          className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,245,255,0.07) 0%, transparent 70%)', filter: 'blur(90px)' }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            <div>
              <div
                data-anim="hero-badge"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
                style={{ background: 'rgba(184,180,255,0.08)', border: '1px solid rgba(184,180,255,0.2)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'hsl(241 100% 88%)' }} />
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'hsl(241 100% 88%)' }}>
                  Sistema de Gestión para Gimnasios
                </span>
              </div>

              <div className="overflow-hidden">
                <h1 data-anim="hero-line" className="font-display leading-none tracking-tight" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(4.5rem, 10vw, 9rem)', lineHeight: '0.9' }}>
                  TOMÁ EL
                </h1>
              </div>
              <div className="overflow-hidden">
                <h1 data-anim="hero-line" className="font-display leading-none tracking-tight gradient-primary" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(4.5rem, 10vw, 9rem)', lineHeight: '0.9' }}>
                  CONTROL
                </h1>
              </div>
              <div className="overflow-hidden">
                <h1 data-anim="hero-line" className="font-display leading-none tracking-tight" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(4.5rem, 10vw, 9rem)', lineHeight: '0.9', color: 'hsl(247 10% 30%)' }}>
                  DE TU GYM
                </h1>
              </div>

              <p data-anim="hero-sub" className="mt-9 text-lg leading-relaxed max-w-lg" style={{ color: 'hsl(247 10% 55%)' }}>
                SGG te da las herramientas para gestionar miembros, rutinas, coaches y horarios.
                Todo desde un panel. Sin complicaciones, sin papel.
              </p>

              <div data-anim="hero-cta" className="mt-10 flex flex-wrap gap-4">
                <a href="/login" className="btn-primary px-8 py-4 rounded-xl font-bold flex items-center gap-2.5 text-sm">
                  Empezar gratis
                  <ArrowRight size={16} strokeWidth={2.5} />
                </a>
                <a href="#como-funciona" className="btn-outline px-8 py-4 rounded-xl text-sm font-medium">
                  Cómo funciona →
                </a>
              </div>

              <p data-anim="hero-cta" className="mt-5 text-xs" style={{ color: 'hsl(247 10% 30%)' }}>
                Sin tarjeta de crédito · Configuración en minutos · Beta gratuita
              </p>
            </div>

            {/* Floating UI mockups */}
            <div className="relative hidden lg:block h-[540px]">

              {/* Dashboard card */}
              <div
                data-anim="float-card"
                className="float-a absolute top-0 left-6 right-0 rounded-2xl overflow-hidden"
                style={{ background: 'hsl(222 24% 14%)', border: '1px solid rgba(184,180,255,0.1)', boxShadow: '0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)' }}
              >
                <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: '1px solid rgba(184,180,255,0.07)' }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                  <span className="ml-3 text-xs font-mono" style={{ color: 'hsl(247 10% 35%)' }}>sgg · panel admin</span>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'hsl(247 10% 45%)' }}>Miembros Activos</div>
                      <div className="font-display text-5xl gradient-primary" style={{ fontFamily: 'var(--font-display)' }}>12</div>
                    </div>
                    <span className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ color: 'hsl(157 78% 52%)', background: 'rgba(53,232,132,0.1)', border: '1px solid rgba(53,232,132,0.2)' }}>
                      +3 este mes
                    </span>
                  </div>
                  <div className="space-y-1">
                    {[
                      { name: 'Martín García', plan: 'Premium', status: 'Activo', active: true },
                      { name: 'Laura Pérez', plan: 'Básico', status: 'Activo', active: true },
                      { name: 'Carlos Ruiz', plan: 'Premium', status: 'Pendiente', active: false },
                      { name: 'Sofía Méndez', plan: 'Premium', status: 'Activo', active: true },
                    ].map((m) => (
                      <div key={m.name} className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid rgba(184,180,255,0.05)' }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: 'rgba(184,180,255,0.1)', color: 'hsl(241 100% 88%)' }}>
                          {m.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate" style={{ color: 'hsl(234 20% 80%)' }}>{m.name}</div>
                          <div className="text-xs" style={{ color: 'hsl(247 10% 40%)' }}>{m.plan}</div>
                        </div>
                        <span className="text-xs font-medium" style={{ color: m.active ? 'hsl(157 78% 52%)' : 'hsl(247 10% 45%)' }}>
                          {m.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rutina card */}
              <div
                data-anim="float-card"
                className="float-b absolute bottom-16 -left-4 rounded-2xl p-5 w-56"
                style={{ background: 'hsl(222 24% 14%)', border: '1px solid rgba(184,180,255,0.18)', boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(184,180,255,0.05)' }}
              >
                <div className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: 'hsl(241 100% 88%)' }}>
                  Rutina Asignada
                </div>
                <div className="font-semibold text-sm mb-3" style={{ color: 'hsl(234 20% 90%)' }}>Full Body Power</div>
                <div className="space-y-2">
                  {['Sentadilla 4×8', 'Press Banca 3×10', 'Peso Muerto 3×6'].map((e) => (
                    <div key={e} className="flex items-center gap-2 text-xs" style={{ color: 'hsl(247 10% 50%)' }}>
                      <CheckCircle size={11} color="hsl(157 78% 52%)" />
                      {e}
                    </div>
                  ))}
                </div>
              </div>

              {/* Adherencia card */}
              <div
                data-anim="float-card"
                className="float-c absolute bottom-4 right-2 rounded-2xl p-5 w-44"
                style={{ background: 'hsl(222 24% 14%)', border: '1px solid rgba(184,180,255,0.08)', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}
              >
                <div className="text-xs mb-1" style={{ color: 'hsl(247 10% 45%)' }}>Adherencia</div>
                <div className="font-display text-4xl" style={{ fontFamily: 'var(--font-display)', color: 'hsl(190 100% 50%)' }}>87%</div>
                <div className="text-xs mt-1 mb-3" style={{ color: 'hsl(247 10% 32%)' }}>esta semana</div>
                <div className="flex items-end gap-1 h-8">
                  {[65, 78, 70, 90, 82, 88, 87].map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{ height: `${v}%`, background: `rgba(0,245,255,${0.2 + (i / 6) * 0.8})` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none" style={{ background: 'linear-gradient(to top, hsl(222 26% 9%), transparent)' }} />
      </section>

      {/* ─── PILLARS ─── */}
      <section data-section="pillars" className="py-16" style={{ borderTop: '1px solid rgba(184,180,255,0.08)', borderBottom: '1px solid rgba(184,180,255,0.08)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
            {pillars.map((p) => (
              <div key={p.label} data-anim="pillar" className="text-center">
                <div
                  className="font-display mb-1"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', lineHeight: 1.1, color: 'hsl(241 100% 88%)' }}
                >
                  {p.label}
                </div>
                <div className="text-xs uppercase tracking-widest mt-1" style={{ color: 'hsl(247 10% 42%)' }}>{p.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section data-section="features" id="funcionalidades" className="py-28 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 max-w-2xl">
            <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: 'hsl(241 100% 88%)' }}>
              Funcionalidades
            </p>
            <h2
              data-anim="section-title"
              className="font-display leading-none"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem, 7vw, 6rem)' }}
            >
              TODO LO QUE
              <br />
              <span className="gradient-primary">NECESITÁS</span>
            </h2>
            <p className="mt-6 text-base leading-relaxed" style={{ color: 'hsl(247 10% 45%)' }}>
              Un sistema completo para que te enfoques en los resultados de tus miembros, no en el papeleo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const c = featureColors[f.color as keyof typeof featureColors]
              return (
                <div
                  key={f.title}
                  data-anim="feature-card"
                  className="card-hover group rounded-2xl p-7"
                  style={{ background: 'hsl(222 24% 13%)', border: '1px solid rgba(184,180,255,0.08)' }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
                    style={{ background: c.iconBg, border: `1px solid ${c.iconBorder}` }}
                  >
                    <f.icon size={20} color={c.iconColor} strokeWidth={1.8} />
                  </div>
                  <h3 className="font-semibold text-base mb-3" style={{ color: 'hsl(234 20% 88%)' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'hsl(247 10% 48%)' }}>{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── ROLES ─── */}
      <section
        data-section="roles"
        id="roles"
        className="py-28 relative overflow-hidden bg-grid"
        style={{ background: 'hsl(222 26% 10%)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(184,180,255,0.2), transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(184,180,255,0.2), transparent)' }} />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="mb-16">
            <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: 'hsl(241 100% 88%)' }}>
              Roles
            </p>
            <h2
              data-anim="section-title"
              className="font-display leading-none"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem, 7vw, 6rem)' }}
            >
              CADA ROL,
              <br />
              <span className="gradient-primary">SU LUGAR</span>
            </h2>
          </div>

          <div data-anim="roles-content">
            <div className="flex flex-wrap gap-2 mb-8">
              {roles.map((r, i) => (
                <button
                  key={r.name}
                  onClick={() => setActiveRole(i)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
                  style={{
                    background: activeRole === i ? r.bgVar : 'transparent',
                    border: `1px solid ${activeRole === i ? r.borderVar : 'rgba(184,180,255,0.1)'}`,
                    color: activeRole === i ? r.colorVar : 'hsl(247 10% 45%)',
                  }}
                >
                  {r.tag}
                </button>
              ))}
            </div>

            <div
              className="rounded-2xl p-8 lg:p-10 transition-all duration-500"
              style={{ background: role.bgVar, border: `1px solid ${role.borderVar}` }}
            >
              <div className="grid md:grid-cols-2 gap-10 items-start">
                <div>
                  <div
                    className="font-display mb-1 leading-none"
                    style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', color: role.colorVar }}
                  >
                    {role.name.toUpperCase()}
                  </div>
                  <p className="text-sm leading-relaxed mt-5 max-w-sm" style={{ color: 'hsl(247 10% 55%)' }}>
                    {role.desc}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                  {role.perks.map((perk) => (
                    <div key={perk} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: role.colorVar }} />
                      <span className="text-sm" style={{ color: 'hsl(234 20% 72%)' }}>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section data-section="steps" id="como-funciona" className="py-28 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 max-w-xl">
            <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: 'hsl(241 100% 88%)' }}>
              Proceso
            </p>
            <h2
              data-anim="section-title"
              className="font-display leading-none"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem, 7vw, 6rem)' }}
            >
              TAN FÁCIL
              <br />
              <span className="gradient-primary">COMO 1, 2, 3</span>
            </h2>
          </div>

          <div className="space-y-4 max-w-3xl">
            {steps.map((step) => (
              <div
                key={step.num}
                data-anim="step"
                className="card-hover group flex items-start gap-8 rounded-2xl p-8"
                style={{ background: 'hsl(222 24% 13%)', border: '1px solid rgba(184,180,255,0.08)' }}
              >
                <div
                  className="font-display text-6xl leading-none flex-shrink-0 transition-colors duration-300 group-hover:text-primary"
                  style={{ fontFamily: 'var(--font-display)', color: 'rgba(184,180,255,0.1)' }}
                >
                  {step.num}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-semibold text-lg mb-2.5" style={{ color: 'hsl(234 20% 88%)' }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'hsl(247 10% 48%)' }}>{step.desc}</p>
                </div>
                <ChevronRight size={18} className="flex-shrink-0 mt-2 transition-colors duration-300" style={{ color: 'rgba(184,180,255,0.15)' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section data-section="cta" className="py-32 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 110%, rgba(184,180,255,0.08) 0%, transparent 65%)' }}
        />
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(184,180,255,0.2), transparent)' }} />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10" data-anim="cta-content">
          <p className="text-xs uppercase tracking-widest font-semibold mb-6" style={{ color: 'hsl(241 100% 88%)' }}>
            ¿Listo?
          </p>
          <h2
            className="font-display leading-none mb-8"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3.5rem, 9vw, 8rem)' }}
          >
            EL SIGUIENTE
            <br />
            <span className="gradient-primary">NIVEL</span> TE ESPERA
          </h2>

          <p className="text-lg mb-12 max-w-lg mx-auto leading-relaxed" style={{ color: 'hsl(247 10% 50%)' }}>
            Empezá hoy sin costo. Sin contratos. Tu gimnasio merece un sistema que esté a la altura.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/login" className="btn-primary px-10 py-5 rounded-xl font-bold flex items-center justify-center gap-2.5 text-base">
              Empezar gratis ahora
              <ArrowRight size={18} strokeWidth={2.5} />
            </a>
            <a href="/login" className="btn-outline px-10 py-5 rounded-xl text-base font-medium">
              Iniciar sesión →
            </a>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-8 text-xs" style={{ color: 'hsl(247 10% 30%)' }}>
            {['Sin tarjeta de crédito', 'Beta gratuita', 'Configuración en minutos', 'Soporte en español'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full" style={{ background: 'rgba(184,180,255,0.4)' }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-14" style={{ borderTop: '1px solid rgba(184,180,255,0.07)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="font-display text-2xl gradient-primary tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
              SGG
            </div>
            <p className="text-sm" style={{ color: 'hsl(247 10% 28%)' }}>
              © {new Date().getFullYear()} SGG — Sistema de Gestión para Gimnasios
            </p>
            <div className="flex gap-6 text-xs" style={{ color: 'hsl(247 10% 28%)' }}>
              {['Términos', 'Privacidad', 'Contacto'].map((item) => (
                <a key={item} href="#" className="transition-colors duration-200 hover:text-white">{item}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
