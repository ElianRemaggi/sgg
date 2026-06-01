'use client'

import { useEffect, useRef, useState } from 'react'
import { ContactForm } from './contact-form'
import Image from 'next/image'
import { Anton, Outfit } from 'next/font/google'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Users,
  TrendingUp,
  Calendar,
  Shield,
  Smartphone,
  ArrowRight,
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
    desc: 'Creá plantillas con bloques y ejercicios, asignalas a cada miembro según su nivel. Del coach directo al plan de entrenamiento.',
  },
  {
    icon: TrendingUp,
    color: 'cyan',
    title: 'Sobrecarga Progresiva',
    desc: 'Cada set registrado con peso y repeticiones. Detectá estancamientos, garantizá progresión y mostrá la evolución real de cada cliente.',
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
    icon: Smartphone,
    color: 'cyan',
    title: 'App Móvil Nativa',
    desc: 'Los miembros tienen su plan siempre a mano en iOS y Android. Rutina del día, registro de peso y progresión — sin abrir el navegador.',
  },
]

const pillars = [
  { label: 'Personalizado', sub: 'Un plan para cada miembro' },
  { label: 'Seguimiento', sub: 'Cada sesión registrada' },
  { label: 'Progresión', sub: 'Sobrecarga progresiva real' },
  { label: 'Beta gratuita', sub: 'Sin costo durante el lanzamiento' },
]

const roles = [
  {
    name: 'Administrador',
    tag: 'ADMIN',
    colorVar: 'var(--primary-color)',
    bgVar: 'var(--primary-bg)',
    borderVar: 'var(--primary-border)',
    desc: 'Control total del gimnasio. Supervisá el equipo, monitoreá la adherencia a las rutinas y tomá decisiones con datos reales.',
    perks: [
      'Panel de control completo',
      'Gestión de miembros y membresías',
      'Gestión de coaches',
      'Seguimiento de rutinas de miembros',
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
    desc: 'Tu expertise, escalado. Diseñá planes de entrenamiento personalizados, controlá la sobrecarga progresiva y seguí la evolución diaria de cada miembro.',
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
    desc: 'Tu entrenamiento, siempre a mano. Ejecutá tu rutina, registrá cada serie y vé cómo avanzás con sobrecarga progresiva y datos reales.',
    perks: [
      'Ver rutina asignada',
      'Registrar ejercicios completados',
      'Historial personal de progreso',
      'Ver horarios de clases',
      'Perfil editable',
      'Gráfico de progresión de peso',
    ],
  },
]

const steps = [
  {
    num: '01',
    title: 'Creá tu Gimnasio',
    desc: 'Dejanos tus datos y te contactamos para configurar tu gimnasio y dejarlo listo para usar.',
  },
  {
    num: '02',
    title: 'Diseñá Rutinas',
    desc: 'Creá plantillas con bloques y ejercicios. Asignalas a tus miembros según sus objetivos y nivel con un solo click.',
  },
  {
    num: '03',
    title: 'Potenciá el Progreso',
    desc: 'Cada sesión registrada con peso y repeticiones. Sobrecarga progresiva visible, historial completo y evolución real para coach y miembro.',
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
      gsap.from('[data-anim="app-copy"]', {
        scrollTrigger: { trigger: '[data-section="app"]', start: 'top 68%' },
        x: -55, opacity: 0, duration: 0.9, ease: 'power3.out',
      })
      gsap.from('[data-anim="app-phones"] > *', {
        scrollTrigger: { trigger: '[data-section="app"]', start: 'top 65%' },
        y: 80, opacity: 0, duration: 0.9, stagger: 0.15, ease: 'back.out(1.2)',
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
                  Entrenamiento Personalizado · Seguimiento Diario · Sobrecarga Progresiva
                </span>
              </div>

              <div className="overflow-hidden">
                <h1 data-anim="hero-line" className="font-display leading-none tracking-tight" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(4.5rem, 10vw, 9rem)', lineHeight: '0.9' }}>
                  DISEÑÁ
                </h1>
              </div>
              <div className="overflow-hidden">
                <h1 data-anim="hero-line" className="font-display leading-none tracking-tight gradient-primary" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(4.5rem, 10vw, 9rem)', lineHeight: '0.9' }}>
                  PROGRESÁ
                </h1>
              </div>
              <div className="overflow-hidden">
                <h1 data-anim="hero-line" className="font-display leading-none tracking-tight" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(4.5rem, 10vw, 9rem)', lineHeight: '0.9', color: 'hsl(247 10% 30%)' }}>
                  POTENCIÁ
                </h1>
              </div>

              <p data-anim="hero-sub" className="mt-9 text-lg leading-relaxed max-w-lg" style={{ color: 'hsl(247 10% 55%)' }}>
                Diseñá rutinas para cada miembro, registrá cada sesión y garantizá sobrecarga progresiva.
                El progreso de tus clientes, visible y medible cada día.
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

            {/* Floating UI screenshots */}
            <div className="relative hidden lg:block h-[540px]">

              {/* Main screenshot — Admin Miembros */}
              <div
                data-anim="float-card"
                className="float-a absolute top-0 left-6 right-0 rounded-2xl overflow-hidden"
                style={{ border: '1px solid rgba(184,180,255,0.15)', boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)' }}
              >
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'hsl(222 24% 11%)', borderBottom: '1px solid rgba(184,180,255,0.08)' }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                  <span className="ml-3 text-xs font-mono" style={{ color: 'hsl(247 10% 35%)' }}>sgg · panel admin</span>
                </div>
                <Image
                  src="/screenshots/admin-members.jpg"
                  unoptimized
                  alt="Panel de administración de miembros"
                  width={1280}
                  height={800}
                  className="w-full h-auto"
                  style={{ display: 'block', maxHeight: '380px', objectFit: 'cover', objectPosition: 'top' }}
                />
              </div>

              {/* Small screenshot — Mi Rutina */}
              <div
                data-anim="float-card"
                className="float-b absolute bottom-16 -left-4 rounded-2xl overflow-hidden w-56"
                style={{ border: '1px solid rgba(184,180,255,0.2)', boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(184,180,255,0.06)' }}
              >
                <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: 'hsl(222 24% 11%)', borderBottom: '1px solid rgba(184,180,255,0.08)' }}>
                  <div className="w-2 h-2 rounded-full bg-[#FF5F57]" />
                  <div className="w-2 h-2 rounded-full bg-[#FFBD2E]" />
                  <div className="w-2 h-2 rounded-full bg-[#28C840]" />
                  <span className="ml-2 text-[10px] font-mono" style={{ color: 'hsl(247 10% 35%)' }}>mi rutina</span>
                </div>
                <Image
                  src="/screenshots/member-routine.jpg"
                  unoptimized
                  alt="Vista de rutina del miembro"
                  width={640}
                  height={400}
                  className="w-full h-auto"
                  style={{ display: 'block', maxHeight: '160px', objectFit: 'cover', objectPosition: 'top' }}
                />
              </div>

              {/* Small screenshot — Historial */}
              <div
                data-anim="float-card"
                className="float-c absolute bottom-4 right-2 rounded-2xl overflow-hidden w-52"
                style={{ border: '1px solid rgba(184,180,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
              >
                <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: 'hsl(222 24% 11%)', borderBottom: '1px solid rgba(184,180,255,0.08)' }}>
                  <div className="w-2 h-2 rounded-full bg-[#FF5F57]" />
                  <div className="w-2 h-2 rounded-full bg-[#FFBD2E]" />
                  <div className="w-2 h-2 rounded-full bg-[#28C840]" />
                  <span className="ml-2 text-[10px] font-mono" style={{ color: 'hsl(247 10% 35%)' }}>historial</span>
                </div>
                <Image
                  src="/screenshots/member-history.jpg"
                  unoptimized
                  alt="Historial de rutinas del miembro"
                  width={640}
                  height={400}
                  className="w-full h-auto"
                  style={{ display: 'block', maxHeight: '150px', objectFit: 'cover', objectPosition: 'top' }}
                />
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
              Entrenamiento personalizado, seguimiento diario y sobrecarga progresiva. Cada herramienta pensada para potenciar el rendimiento real de cada miembro.
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

      {/* ─── PREVIEW SCREENSHOTS ─── */}
      <section data-section="preview" className="py-28 relative overflow-hidden" style={{ background: 'hsl(222 26% 10%)' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(184,180,255,0.2), transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(184,180,255,0.2), transparent)' }} />

        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 max-w-2xl">
            <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: 'hsl(241 100% 88%)' }}>
              Vista previa
            </p>
            <h2
              data-anim="section-title"
              className="font-display leading-none"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem, 7vw, 6rem)' }}
            >
              ASÍ SE
              <br />
              <span className="gradient-primary">VE EN VIVO</span>
            </h2>
            <p className="mt-6 text-base leading-relaxed" style={{ color: 'hsl(247 10% 45%)' }}>
              Capturas reales del sistema. Sin mockups, sin diseños ficticios.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { src: '/screenshots/admin-members.jpg', label: 'Admin · Gestión de miembros', alt: 'Panel de administración de miembros' },
              { src: '/screenshots/coach-templates.jpg', label: 'Coach · Plantillas de rutinas', alt: 'Plantillas de rutina del coach' },
              { src: '/screenshots/member-routine.jpg', label: 'Miembro · Mi rutina activa', alt: 'Vista de rutina del miembro' },
              { src: '/screenshots/member-history.jpg', label: 'Miembro · Historial de progreso', alt: 'Historial de rutinas del miembro' },
            ].map((item) => (
              <div
                key={item.src}
                data-anim="feature-card"
                className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid rgba(184,180,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
              >
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'hsl(222 24% 11%)', borderBottom: '1px solid rgba(184,180,255,0.07)' }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                  <span className="ml-3 text-xs font-mono" style={{ color: 'hsl(247 10% 40%)' }}>{item.label}</span>
                </div>
                <Image
                  src={item.src}
                  alt={item.alt}
                  unoptimized
                  width={1280}
                  height={800}
                  className="w-full h-auto"
                  style={{ display: 'block' }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── APP MÓVIL ─── */}
      <section data-section="app" id="app-movil" className="py-28 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 75% 60% at 65% 50%, rgba(0,245,255,0.05) 0%, transparent 70%)' }}
        />

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Copy */}
            <div data-anim="app-copy">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
                style={{ background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.18)' }}
              >
                <Smartphone size={13} color="hsl(190 100% 50%)" />
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'hsl(190 100% 50%)' }}>
                  App Móvil · iOS & Android
                </span>
              </div>

              <h2
                data-anim="section-title"
                className="font-display leading-none mb-6"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem, 7vw, 6rem)' }}
              >
                TU RUTINA
                <br />
                <span className="gradient-tertiary">EN TU BOLSILLO</span>
              </h2>

              <p className="text-base leading-relaxed mb-10" style={{ color: 'hsl(247 10% 50%)' }}>
                Los miembros tienen su entrenamiento siempre a mano. La app está diseñada para usarse en el gym:
                ves tu rutina del día, marcás cada ejercicio con peso y repeticiones, y el sistema construye
                tu historial de progresión automáticamente.
              </p>

              <div className="space-y-3">
                {[
                  {
                    title: 'Rutina del día',
                    desc: 'Selector de bloques y ejercicios con series, reps y descanso definidos por el coach.',
                    color: 'hsl(190 100% 50%)',
                    bg: 'rgba(0,245,255,0.06)',
                    border: 'rgba(0,245,255,0.1)',
                  },
                  {
                    title: 'Registro por ejercicio',
                    desc: 'Peso en kg, repeticiones reales y notas opcionales. Cada sesión guardada con fecha.',
                    color: 'hsl(157 78% 52%)',
                    bg: 'rgba(53,232,132,0.05)',
                    border: 'rgba(53,232,132,0.1)',
                  },
                  {
                    title: 'Gráfico de progresión',
                    desc: 'Evolución de peso sesión a sesión con gráfico visual. Detectá estancamientos antes de que frenen el progreso.',
                    color: 'hsl(241 100% 88%)',
                    bg: 'rgba(184,180,255,0.05)',
                    border: 'rgba(184,180,255,0.1)',
                  },
                  {
                    title: 'Dark mode y múltiples gyms',
                    desc: 'Tema claro, oscuro o automático. Soporte para pertenecer a varios gimnasios con una sola cuenta.',
                    color: 'hsl(190 100% 50%)',
                    bg: 'rgba(0,245,255,0.04)',
                    border: 'rgba(0,245,255,0.08)',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-4 rounded-xl p-4"
                    style={{ background: item.bg, border: `1px solid ${item.border}` }}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                      style={{ background: item.color }}
                    />
                    <div>
                      <div className="text-sm font-semibold mb-0.5" style={{ color: 'hsl(234 20% 88%)' }}>
                        {item.title}
                      </div>
                      <div className="text-xs leading-relaxed" style={{ color: 'hsl(247 10% 48%)' }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phone mockups */}
            <div
              data-anim="app-phones"
              className="relative hidden lg:flex justify-center items-center gap-4"
              style={{ height: '600px' }}
            >
              {[
                {
                  src: '/screenshots/member-routine.jpg',
                  label: 'Mi Rutina',
                  offsetY: 0,
                  zIndex: 2,
                  borderColor: 'rgba(184,180,255,0.2)',
                  glow: 'rgba(184,180,255,0.1)',
                  labelColor: 'hsl(247 10% 42%)',
                },
                {
                  src: '/screenshots/member-history.jpg',
                  label: 'Historial',
                  offsetY: -50,
                  zIndex: 3,
                  borderColor: 'rgba(0,245,255,0.35)',
                  glow: 'rgba(0,245,255,0.14)',
                  labelColor: 'hsl(190 100% 50%)',
                },
                {
                  src: '/screenshots/member-progress-chart.jpg',
                  label: 'Progresión',
                  offsetY: 40,
                  zIndex: 2,
                  borderColor: 'rgba(53,232,132,0.2)',
                  glow: 'rgba(53,232,132,0.1)',
                  labelColor: 'hsl(247 10% 42%)',
                },
              ].map((phone) => (
                <div
                  key={phone.label}
                  className="flex-shrink-0"
                  style={{
                    marginTop: `${phone.offsetY}px`,
                    zIndex: phone.zIndex,
                    position: 'relative',
                  }}
                >
                  {/* Phone frame */}
                  <div
                    style={{
                      width: '178px',
                      borderRadius: '38px',
                      background: 'hsl(222 24% 7%)',
                      border: `1.5px solid ${phone.borderColor}`,
                      boxShadow: `0 40px 90px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.02), 0 0 50px ${phone.glow}`,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Status bar + notch */}
                    <div
                      className="relative flex items-center justify-center"
                      style={{ height: '28px', background: 'hsl(222 24% 8%)' }}
                    >
                      <div
                        style={{
                          width: '64px',
                          height: '18px',
                          background: 'hsl(222 24% 5%)',
                          borderRadius: '0 0 14px 14px',
                        }}
                      />
                    </div>
                    {/* Screenshot */}
                    <Image
                      src={phone.src}
                      alt={phone.label}
                      unoptimized
                      width={640}
                      height={960}
                      className="w-full h-auto"
                      style={{ display: 'block', maxHeight: '350px', objectFit: 'cover', objectPosition: 'top' }}
                    />
                    {/* Home indicator */}
                    <div
                      className="flex items-center justify-center"
                      style={{ height: '22px', background: 'hsl(222 24% 8%)' }}
                    >
                      <div
                        style={{
                          width: '44px',
                          height: '4px',
                          background: 'rgba(255,255,255,0.12)',
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                  </div>
                  {/* Label */}
                  <p
                    className="text-center text-xs font-medium mt-3"
                    style={{ color: phone.labelColor }}
                  >
                    {phone.label}
                  </p>
                </div>
              ))}
            </div>

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
            Empezá hoy sin costo. Diseñá rutinas personalizadas, garantizá sobrecarga progresiva y potenciá el crecimiento real de cada miembro. Sin contratos.
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

      {/* ─── CONTACTO ─── */}
      <section id="contacto" className="py-24 relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(99,102,241,0.06) 0%, transparent 70%)' }}
        />
        <div className="max-w-2xl mx-auto px-6 relative z-10">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'hsl(241 100% 88%)' }}>
              Sumate
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              ¿Querés sumar tu gimnasio?
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'hsl(247 10% 50%)' }}>
              Completá el formulario y te contactamos para dejarlo todo configurado.
            </p>
          </div>
          <ContactForm />
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
              <a href="#" className="transition-colors duration-200 hover:text-white">Términos</a>
              <a href="/privacy" className="transition-colors duration-200 hover:text-white">Privacidad</a>
              <a href="#contacto" className="transition-colors duration-200 hover:text-white">Contacto</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
