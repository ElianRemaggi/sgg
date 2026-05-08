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
    title: 'Gestión de Miembros',
    desc: 'Alta, baja y seguimiento de cada miembro. Membresías, estados y historial completo en un solo lugar.',
  },
  {
    icon: Dumbbell,
    title: 'Rutinas Personalizadas',
    desc: 'Creá plantillas de entrenamiento y asignaselas a tus miembros en segundos. Desde el coach directo al miembro.',
  },
  {
    icon: TrendingUp,
    title: 'Seguimiento de Progreso',
    desc: 'Cada ejercicio completado queda registrado. Métricas reales de adherencia y rendimiento con historial.',
  },
  {
    icon: Calendar,
    title: 'Horarios y Clases',
    desc: 'Gestioná clases grupales, turnos y disponibilidad de coaches con un calendario integrado y visual.',
  },
  {
    icon: Shield,
    title: 'Roles y Permisos',
    desc: 'Admin, Coach y Miembro con accesos diferenciados. Cada uno ve y hace solo lo que necesita.',
  },
  {
    icon: Building2,
    title: 'Multi-Sede',
    desc: 'Gestioná múltiples sucursales desde un único panel. Datos separados, visión unificada y total.',
  },
]

const stats = [
  { value: 500, suffix: '+', label: 'Gimnasios' },
  { value: 10000, suffix: '+', label: 'Miembros Activos' },
  { value: 98, suffix: '%', label: 'Satisfacción' },
  { value: 3, suffix: '', label: 'Años en el mercado' },
]

const roles = [
  {
    name: 'Administrador',
    tag: 'ADMIN',
    color: '#D4A843',
    bg: 'rgba(212, 168, 67, 0.08)',
    border: 'rgba(212, 168, 67, 0.25)',
    desc: 'Control total del gimnasio. Desde gestión de miembros hasta reportes avanzados, todo en tus manos.',
    perks: [
      'Panel de control completo',
      'Gestión de miembros y membresías',
      'Gestión de coaches',
      'Reportes y métricas',
      'Configuración del gimnasio',
      'Aprobación de nuevos miembros',
    ],
  },
  {
    name: 'Coach',
    tag: 'COACH',
    color: '#2DD4BF',
    bg: 'rgba(45, 212, 191, 0.08)',
    border: 'rgba(45, 212, 191, 0.25)',
    desc: 'Diseña y asigna rutinas personalizadas, hace seguimiento del progreso y gestiona los horarios.',
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
    color: '#A78BFA',
    bg: 'rgba(167, 139, 250, 0.08)',
    border: 'rgba(167, 139, 250, 0.25)',
    desc: 'Accede a su rutina, registra sus entrenamientos y ve su evolución. Simple, claro y motivador.',
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
    desc: 'Registrate, configurá tu gimnasio y personalizalo en minutos. Sin tarjeta de crédito, sin burocracia.',
  },
  {
    num: '02',
    title: 'Sumá tu Equipo',
    desc: 'Invitá coaches, aprobá miembros y definí roles. Cada persona accede con su perfil y sus permisos.',
  },
  {
    num: '03',
    title: 'Gestioná Todo',
    desc: 'Rutinas, horarios, seguimiento y métricas desde un solo panel. Tu gimnasio, completamente bajo control.',
  },
]

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [activeRole, setActiveRole] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      // Hero badge
      gsap.from('[data-anim="hero-badge"]', {
        y: 20,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        delay: 0.1,
      })

      // Hero title lines
      gsap.from('[data-anim="hero-line"]', {
        y: 130,
        opacity: 0,
        duration: 1.1,
        stagger: 0.1,
        ease: 'power4.out',
        delay: 0.25,
      })

      // Hero subtitle
      gsap.from('[data-anim="hero-sub"]', {
        y: 30,
        opacity: 0,
        duration: 0.9,
        delay: 0.6,
        ease: 'power3.out',
      })

      // Hero CTAs
      gsap.from('[data-anim="hero-cta"]', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        delay: 0.78,
        ease: 'power3.out',
      })

      // Floating cards
      gsap.from('[data-anim="float-card"]', {
        y: 60,
        opacity: 0,
        duration: 1.1,
        stagger: 0.18,
        delay: 0.95,
        ease: 'back.out(1.4)',
      })

      // Hero orbs parallax
      gsap.to('[data-anim="orb-1"]', {
        scrollTrigger: {
          trigger: '[data-section="hero"]',
          scrub: 2,
        },
        y: -220,
        ease: 'none',
      })

      gsap.to('[data-anim="orb-2"]', {
        scrollTrigger: {
          trigger: '[data-section="hero"]',
          scrub: 3.5,
        },
        y: -100,
        x: 40,
        ease: 'none',
      })

      // Stats counters
      document.querySelectorAll('[data-count]').forEach((el) => {
        const target = parseInt(el.getAttribute('data-count') || '0')
        const suffix = el.getAttribute('data-suffix') || ''
        const obj = { val: 0 }
        ScrollTrigger.create({
          trigger: el,
          start: 'top 80%',
          onEnter: () => {
            gsap.to(obj, {
              val: target,
              duration: 2.2,
              ease: 'power2.out',
              onUpdate: () => {
                el.textContent = Math.round(obj.val).toLocaleString('es') + suffix
              },
            })
          },
          once: true,
        })
      })

      // Feature cards
      gsap.from('[data-anim="feature-card"]', {
        scrollTrigger: {
          trigger: '[data-section="features"]',
          start: 'top 68%',
        },
        y: 70,
        opacity: 0,
        duration: 0.7,
        stagger: { amount: 0.55 },
        ease: 'power3.out',
      })

      // Section titles
      gsap.utils.toArray<Element>('[data-anim="section-title"]').forEach((el) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: 'top 87%' },
          y: 45,
          opacity: 0,
          duration: 0.95,
          ease: 'power3.out',
        })
      })

      // Roles container
      gsap.from('[data-anim="roles-content"]', {
        scrollTrigger: {
          trigger: '[data-section="roles"]',
          start: 'top 68%',
        },
        y: 55,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
      })

      // Steps
      gsap.from('[data-anim="step"]', {
        scrollTrigger: {
          trigger: '[data-section="steps"]',
          start: 'top 68%',
        },
        x: -60,
        opacity: 0,
        duration: 0.85,
        stagger: 0.18,
        ease: 'power3.out',
      })

      // CTA
      gsap.from('[data-anim="cta-content"]', {
        scrollTrigger: {
          trigger: '[data-section="cta"]',
          start: 'top 75%',
        },
        y: 55,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      })

      // Nav scroll
      ScrollTrigger.create({
        start: 'top -60',
        onUpdate: (self) => {
          const nav = document.querySelector('[data-anim="nav"]') as HTMLElement | null
          if (!nav) return
          if (self.scroll() > 60) {
            nav.style.background = 'rgba(7,7,7,0.92)'
            nav.style.borderBottom = '1px solid rgba(212,168,67,0.12)'
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

  return (
    <div
      ref={rootRef}
      className={`${anton.variable} ${outfit.variable} bg-[#070707] text-[#F0EDE8] overflow-x-hidden min-h-screen`}
      style={{ fontFamily: 'var(--font-body, Outfit, sans-serif)' }}
    >
      <style>{`
        :root {
          --gold: #D4A843;
          --gold-light: #ECC96A;
        }
        .font-display { font-family: var(--font-display, Anton, sans-serif); }
        .gold-gradient {
          background: linear-gradient(135deg, #D4A843 0%, #F0C060 45%, #B8882A 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .bg-grid {
          background-image:
            linear-gradient(rgba(212, 168, 67, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212, 168, 67, 0.035) 1px, transparent 1px);
          background-size: 64px 64px;
        }
        .card-hover {
          transition: border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
        }
        .card-hover:hover {
          border-color: rgba(212, 168, 67, 0.35) !important;
          transform: translateY(-5px);
          box-shadow: 0 24px 64px rgba(212, 168, 67, 0.07);
        }
        .btn-gold {
          background: linear-gradient(135deg, #C89B35, #E8B840, #C89B35);
          background-size: 200% 100%;
          transition: all 0.35s ease;
        }
        .btn-gold:hover {
          background-position: right center;
          transform: translateY(-2px);
          box-shadow: 0 14px 44px rgba(212, 168, 67, 0.38);
        }
        .btn-outline {
          border: 1px solid rgba(212, 168, 67, 0.35);
          transition: all 0.3s ease;
        }
        .btn-outline:hover {
          border-color: #D4A843;
          background: rgba(212, 168, 67, 0.07);
          transform: translateY(-2px);
        }
        .noise-bg {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          background-size: 200px 200px;
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
        .role-tab-active { }
        .step-line::before {
          content: '';
          position: absolute;
          left: 28px; top: 0; bottom: 0;
          width: 1px;
          background: linear-gradient(to bottom, rgba(212,168,67,0.4), transparent);
        }
      `}</style>

      {/* ─── NAV ─── */}
      <nav
        data-anim="nav"
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ background: 'transparent', borderBottom: '1px solid transparent' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div
            className="font-display text-2xl tracking-wider gold-gradient select-none"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            SGG
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-[#666]">
            {[
              { label: 'Funcionalidades', href: '#funcionalidades' },
              { label: 'Roles', href: '#roles' },
              { label: 'Cómo funciona', href: '#como-funciona' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="hover:text-[#F0EDE8] transition-colors duration-200"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <a
              href="/login"
              className="text-sm text-[#666] hover:text-[#F0EDE8] transition-colors"
            >
              Iniciar sesión
            </a>
            <a
              href="/login"
              className="btn-gold px-5 py-2.5 rounded-xl text-sm font-bold text-[#080808]"
            >
              Empezar gratis
            </a>
          </div>

          <button
            className="md:hidden text-[#F0EDE8] p-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-[#0C0C0C] border-t border-[#1A1A1A] px-6 py-6 flex flex-col gap-4">
            {[
              { label: 'Funcionalidades', href: '#funcionalidades' },
              { label: 'Roles', href: '#roles' },
              { label: 'Cómo funciona', href: '#como-funciona' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-[#888] hover:text-[#F0EDE8] transition-colors py-1 text-sm"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              href="/login"
              className="btn-gold px-5 py-3.5 rounded-xl text-sm font-bold text-[#080808] text-center mt-2"
            >
              Empezar gratis
            </a>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section
        data-section="hero"
        className="relative min-h-screen flex items-center bg-grid overflow-hidden"
      >
        <div className="noise-bg" />

        {/* Orbs */}
        <div
          data-anim="orb-1"
          className="absolute top-1/4 right-1/3 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(212,168,67,0.13) 0%, transparent 68%)',
            filter: 'blur(70px)',
          }}
        />
        <div
          data-anim="orb-2"
          className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(45,212,191,0.07) 0%, transparent 70%)',
            filter: 'blur(90px)',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left */}
            <div>
              <div data-anim="hero-badge" className="inline-flex items-center gap-2 bg-[#D4A843]/10 border border-[#D4A843]/25 px-4 py-2 rounded-full mb-8">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4A843] animate-pulse" />
                <span className="text-[#D4A843] text-xs font-semibold uppercase tracking-widest">
                  Sistema de Gestión para Gimnasios
                </span>
              </div>

              <div className="overflow-hidden">
                <h1
                  data-anim="hero-line"
                  className="font-display leading-none tracking-tight"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(4.5rem, 10vw, 9rem)',
                    lineHeight: '0.9',
                  }}
                >
                  TRANS
                </h1>
              </div>

              <div className="overflow-hidden">
                <h1
                  data-anim="hero-line"
                  className="font-display leading-none tracking-tight gold-gradient"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(4.5rem, 10vw, 9rem)',
                    lineHeight: '0.9',
                  }}
                >
                  FORMÁ
                </h1>
              </div>

              <div className="overflow-hidden">
                <h1
                  data-anim="hero-line"
                  className="font-display leading-none tracking-tight"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(4.5rem, 10vw, 9rem)',
                    lineHeight: '0.9',
                    color: '#2A2A2A',
                  }}
                >
                  TU GYM
                </h1>
              </div>

              <p
                data-anim="hero-sub"
                className="mt-9 text-[#777] text-lg leading-relaxed max-w-lg"
              >
                SGG es el SaaS que necesitás para gestionar miembros, rutinas, coaches y horarios.
                Todo desde un panel. Sin complicaciones, sin papel.
              </p>

              <div data-anim="hero-cta" className="mt-10 flex flex-wrap gap-4">
                <a
                  href="/login"
                  className="btn-gold px-8 py-4 rounded-xl font-bold text-[#080808] flex items-center gap-2.5 text-sm"
                >
                  Empezar gratis
                  <ArrowRight size={16} strokeWidth={2.5} />
                </a>
                <button className="btn-outline px-8 py-4 rounded-xl text-sm font-medium text-[#CCC]">
                  Ver demo →
                </button>
              </div>

              <p data-anim="hero-cta" className="mt-5 text-[#3A3A3A] text-xs">
                Sin tarjeta de crédito · Configuración en minutos · Soporte incluido
              </p>
            </div>

            {/* Right: Floating UI mockups */}
            <div className="relative hidden lg:block h-[540px]">

              {/* Main dashboard card */}
              <div
                data-anim="float-card"
                className="float-a absolute top-0 left-6 right-0 bg-[#0F0F0F] border border-[#1E1E1E] rounded-2xl overflow-hidden"
                style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)' }}
              >
                {/* Card header */}
                <div className="flex items-center gap-2 px-5 py-3 border-b border-[#171717]">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                  <span className="ml-3 text-xs text-[#444] font-mono">sgg · panel admin</span>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="text-xs text-[#555] uppercase tracking-wider mb-1">Miembros Activos</div>
                      <div
                        className="font-display text-5xl gold-gradient"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        247
                      </div>
                    </div>
                    <span className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-full font-medium">
                      +12% este mes
                    </span>
                  </div>

                  <div className="space-y-1">
                    {[
                      { name: 'Martín García', plan: 'Premium', color: '#D4A843', status: 'Activo' },
                      { name: 'Laura Pérez', plan: 'Básico', color: '#D4A843', status: 'Activo' },
                      { name: 'Carlos Ruiz', plan: 'Premium', color: '#666', status: 'Pendiente' },
                      { name: 'Sofía Méndez', plan: 'Premium', color: '#D4A843', status: 'Activo' },
                    ].map((m) => (
                      <div
                        key={m.name}
                        className="flex items-center gap-3 py-2.5 border-b border-[#141414] last:border-0"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: 'rgba(212,168,67,0.1)', color: '#D4A843' }}
                        >
                          {m.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-[#D0D0D0] truncate">{m.name}</div>
                          <div className="text-xs text-[#444]">{m.plan}</div>
                        </div>
                        <span className="text-xs font-medium" style={{ color: m.color }}>
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
                className="float-b absolute bottom-16 -left-4 bg-[#0F0F0F] rounded-2xl p-5 w-56"
                style={{
                  border: '1px solid rgba(212,168,67,0.2)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(212,168,67,0.06)',
                }}
              >
                <div className="text-xs text-[#D4A843] uppercase tracking-wider font-semibold mb-3">
                  Rutina Asignada
                </div>
                <div className="font-semibold text-sm text-[#F0EDE8] mb-3">Full Body Power</div>
                <div className="space-y-2">
                  {['Sentadilla 4×8', 'Press Banca 3×10', 'Peso Muerto 3×6'].map((e) => (
                    <div key={e} className="flex items-center gap-2 text-xs text-[#555]">
                      <CheckCircle size={11} color="#D4A843" />
                      {e}
                    </div>
                  ))}
                </div>
              </div>

              {/* Adherencia card */}
              <div
                data-anim="float-card"
                className="float-c absolute bottom-4 right-2 bg-[#0F0F0F] border border-[#1A1A1A] rounded-2xl p-5 w-44"
                style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
              >
                <div className="text-xs text-[#555] mb-1">Adherencia</div>
                <div
                  className="font-display text-4xl"
                  style={{ fontFamily: 'var(--font-display)', color: '#2DD4BF' }}
                >
                  87%
                </div>
                <div className="text-xs text-[#3A3A3A] mt-1 mb-3">esta semana</div>
                <div className="flex items-end gap-1 h-8">
                  {[65, 78, 70, 90, 82, 88, 87].map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        height: `${(v / 100) * 100}%`,
                        background: `rgba(45, 212, 191, ${0.25 + (i / 6) * 0.75})`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #070707, transparent)' }}
        />
      </section>

      {/* ─── STATS ─── */}
      <section className="py-20 border-y border-[#141414] relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-12">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div
                  className="font-display gold-gradient"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(3rem, 6vw, 5.5rem)',
                    lineHeight: 1,
                  }}
                  data-count={s.value}
                  data-suffix={s.suffix}
                >
                  0{s.suffix}
                </div>
                <div className="mt-2 text-[#555] text-xs uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section data-section="features" id="funcionalidades" className="py-28 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 max-w-2xl">
            <p className="text-[#D4A843] text-xs uppercase tracking-widest font-semibold mb-4">
              Funcionalidades
            </p>
            <h2
              data-anim="section-title"
              className="font-display leading-none"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(3rem, 7vw, 6rem)',
              }}
            >
              TODO LO QUE
              <br />
              <span className="gold-gradient">NECESITÁS</span>
            </h2>
            <p className="mt-6 text-[#555] text-base leading-relaxed">
              Un sistema completo para que vos te enfoques en los resultados de tus miembros,
              no en el papeleo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                data-anim="feature-card"
                className="card-hover group bg-[#0C0C0C] border border-[#181818] rounded-2xl p-7"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: 'rgba(212,168,67,0.08)',
                    border: '1px solid rgba(212,168,67,0.15)',
                  }}
                >
                  <f.icon size={20} color="#D4A843" strokeWidth={1.8} />
                </div>
                <h3 className="font-semibold text-[#E8E8E8] text-base mb-3">{f.title}</h3>
                <p className="text-[#555] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ROLES ─── */}
      <section
        data-section="roles"
        id="roles"
        className="py-28 bg-[#090909] relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(212,168,67,0.3), transparent)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(212,168,67,0.3), transparent)',
          }}
        />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="mb-16">
            <p className="text-[#D4A843] text-xs uppercase tracking-widest font-semibold mb-4">
              Roles
            </p>
            <h2
              data-anim="section-title"
              className="font-display leading-none"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(3rem, 7vw, 6rem)',
              }}
            >
              CADA ROL,
              <br />
              <span className="gold-gradient">SU LUGAR</span>
            </h2>
          </div>

          <div data-anim="roles-content">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-8">
              {roles.map((role, i) => (
                <button
                  key={role.name}
                  onClick={() => setActiveRole(i)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
                  style={{
                    background: activeRole === i ? role.bg : 'transparent',
                    border: `1px solid ${activeRole === i ? role.border : '#1E1E1E'}`,
                    color: activeRole === i ? role.color : '#555',
                  }}
                >
                  {role.tag}
                </button>
              ))}
            </div>

            {/* Role panel */}
            <div
              className="rounded-2xl p-8 lg:p-10 transition-all duration-500"
              style={{
                background: roles[activeRole].bg,
                border: `1px solid ${roles[activeRole].border}`,
              }}
            >
              <div className="grid md:grid-cols-2 gap-10 items-start">
                <div>
                  <div
                    className="font-display mb-1 leading-none"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                      color: roles[activeRole].color,
                    }}
                  >
                    {roles[activeRole].name.toUpperCase()}
                  </div>
                  <p className="text-[#666] text-sm leading-relaxed mt-5 max-w-sm">
                    {roles[activeRole].desc}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                  {roles[activeRole].perks.map((perk) => (
                    <div key={perk} className="flex items-center gap-3">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: roles[activeRole].color }}
                      />
                      <span className="text-sm text-[#C0C0C0]">{perk}</span>
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
            <p className="text-[#D4A843] text-xs uppercase tracking-widest font-semibold mb-4">
              Proceso
            </p>
            <h2
              data-anim="section-title"
              className="font-display leading-none"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(3rem, 7vw, 6rem)',
              }}
            >
              TAN FÁCIL
              <br />
              <span className="gold-gradient">COMO 1, 2, 3</span>
            </h2>
          </div>

          <div className="space-y-4 max-w-3xl">
            {steps.map((step) => (
              <div
                key={step.num}
                data-anim="step"
                className="card-hover group flex items-start gap-8 bg-[#0C0C0C] border border-[#181818] rounded-2xl p-8"
              >
                <div
                  className="font-display text-6xl leading-none flex-shrink-0 transition-colors duration-300"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: '#1A1A1A',
                  }}
                >
                  {step.num}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-semibold text-[#E8E8E8] text-lg mb-2.5">{step.title}</h3>
                  <p className="text-[#555] text-sm leading-relaxed">{step.desc}</p>
                </div>
                <ChevronRight
                  size={18}
                  className="text-[#282828] group-hover:text-[#D4A843] transition-colors duration-300 flex-shrink-0 mt-2"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section data-section="cta" className="py-32 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 90% 70% at 50% 110%, rgba(212,168,67,0.09) 0%, transparent 65%)',
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(212,168,67,0.25), transparent)',
          }}
        />

        <div
          className="max-w-4xl mx-auto px-6 text-center relative z-10"
          data-anim="cta-content"
        >
          <p className="text-[#D4A843] text-xs uppercase tracking-widest font-semibold mb-6">
            ¿Listo?
          </p>
          <h2
            className="font-display leading-none mb-8"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(3.5rem, 9vw, 8rem)',
            }}
          >
            EL SIGUIENTE
            <br />
            <span className="gold-gradient">NIVEL</span> TE ESPERA
          </h2>

          <p className="text-[#666] text-lg mb-12 max-w-lg mx-auto leading-relaxed">
            Empezá hoy sin costo. Sin contratos, sin límites. Tu gimnasio merece el mejor sistema.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/login"
              className="btn-gold px-10 py-5 rounded-xl font-bold text-[#080808] flex items-center justify-center gap-2.5 text-base"
            >
              Empezar gratis ahora
              <ArrowRight size={18} strokeWidth={2.5} />
            </a>
            <button className="btn-outline px-10 py-5 rounded-xl text-base font-medium text-[#CCC]">
              Hablar con ventas
            </button>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-8 text-xs text-[#363636]">
            {[
              'Sin tarjeta de crédito',
              'Soporte en español',
              'Configuración en minutos',
              'Cancelás cuando quieras',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[#D4A843]/50" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[#121212] py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div
              className="font-display text-2xl gold-gradient tracking-wider"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              SGG
            </div>

            <p className="text-[#383838] text-sm">
              © {new Date().getFullYear()} SGG — Sistema de Gestión para Gimnasios
            </p>

            <div className="flex gap-6 text-xs text-[#383838]">
              {['Términos', 'Privacidad', 'Contacto'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="hover:text-[#888] transition-colors duration-200"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
