import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad — SGG',
  description: 'Política de privacidad de SGG, sistema de gestión para gimnasios.',
}

const LAST_UPDATED = '27 de mayo de 2026'
const CONTACT_EMAIL = 'elianremaggi@gmail.com'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-800">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Política de Privacidad</h1>
        <p className="text-sm text-slate-500 mb-12">Última actualización: {LAST_UPDATED}</p>

        <Section title="1. Quiénes somos">
          <p>
            SGG es una plataforma SaaS de gestión para gimnasios. El servicio incluye un panel web
            para administradores y coaches, y una aplicación móvil para miembros. Podés contactarnos
            en <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-600 underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section title="2. Qué datos recolectamos">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Datos de cuenta:</strong> nombre completo, dirección de correo electrónico, nombre de usuario y, opcionalmente, foto de perfil.</li>
            <li><strong>Datos de membresía:</strong> el o los gimnasios a los que pertenecés, tu rol (miembro, coach, administrador) y el estado de tu membresía.</li>
            <li><strong>Datos de entrenamiento:</strong> las rutinas que te asigna tu coach y el registro de ejercicios completados (tracking).</li>
            <li><strong>Datos técnicos:</strong> identificadores de sesión necesarios para autenticarte de forma segura.</li>
          </ul>
        </Section>

        <Section title="3. Cómo usamos tus datos">
          <p>Usamos tus datos exclusivamente para operar el servicio:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Autenticarte y mantener tu sesión activa.</li>
            <li>Asociarte con el o los gimnasios donde tenés membresía.</li>
            <li>Mostrarte tu rutina asignada y registrar tu progreso de entrenamiento.</li>
            <li>Permitirte editar tu perfil (nombre y foto).</li>
          </ul>
          <p className="mt-2">No vendemos tus datos ni los usamos con fines publicitarios.</p>
        </Section>

        <Section title="4. Terceros">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase:</strong> proveedor de autenticación y base de datos. Tus credenciales de acceso son procesadas por Supabase. Política de privacidad: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-green-600 underline">supabase.com/privacy</a>.</li>
            <li><strong>Google (OAuth):</strong> si elegís iniciar sesión con Google, el proceso de autenticación es gestionado por Google. Política de privacidad: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-green-600 underline">policies.google.com/privacy</a>.</li>
          </ul>
        </Section>

        <Section title="5. Retención y eliminación de datos">
          <p>
            Podés eliminar tu cuenta en cualquier momento desde la sección <strong>Perfil</strong>{' '}
            de la aplicación móvil, tocando el botón <em>&ldquo;Eliminar cuenta&rdquo;</em>. Al confirmar:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Tu cuenta quedará marcada como eliminada y no podrás volver a iniciar sesión.</li>
            <li>Tus datos personales (nombre, email, foto) serán anonimizados.</li>
            <li>Tus membresías activas serán desactivadas.</li>
            <li>Tu historial de entrenamiento permanece anonimizado en nuestros sistemas con fines estadísticos.</li>
          </ul>
          <p className="mt-2">
            También podés solicitar la eliminación de tus datos escribiéndonos a{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-600 underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section title="6. Tus derechos">
          <p>Podés ejercer en cualquier momento los siguientes derechos escribiéndonos a <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-600 underline">{CONTACT_EMAIL}</a>:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Acceso:</strong> solicitar una copia de tus datos personales.</li>
            <li><strong>Rectificación:</strong> corregir datos incorrectos (también podés hacerlo directamente desde la app).</li>
            <li><strong>Eliminación:</strong> solicitar la eliminación de tu cuenta y datos.</li>
          </ul>
        </Section>

        <Section title="7. Cambios a esta política">
          <p>
            Podemos actualizar esta política ocasionalmente. Cuando hagamos cambios significativos,
            actualizaremos la fecha al inicio de esta página. Te recomendamos revisarla periódicamente.
          </p>
        </Section>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-slate-900 mb-3">{title}</h2>
      <div className="text-slate-600 leading-relaxed space-y-2 text-sm">{children}</div>
    </section>
  )
}
