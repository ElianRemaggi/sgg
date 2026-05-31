# SGG — Documento de Producto

---

## ¿Qué es SGG?

SGG es una plataforma SaaS para gimnasios que conecta a los dueños, coaches y miembros en un solo sistema.

El problema que resuelve es concreto: la mayoría de los gimnasios gestionan rutinas en papel, hojas de cálculo o grupos de WhatsApp. No hay forma de saber si un miembro realmente progresó, si el coach está haciendo sobrecarga progresiva, o si alguien dejó de entrenar antes de que sea demasiado tarde.

SGG le da a cada actor lo que necesita: el admin controla el negocio, el coach diseña y sigue rutinas personalizadas, y el miembro tiene su plan de entrenamiento en el celular con registro de cada sesión.

---

## Para quién es

| Perfil | Problema que tiene hoy |
|--------|------------------------|
| Dueño / admin de gym | No sabe si los miembros están entrenando ni cómo van |
| Coach | Diseña rutinas en papel, no puede hacer seguimiento real de sobrecarga progresiva |
| Miembro | No tiene acceso a su rutina fuera del gym, no ve su progreso |

---

## Roles

### Administrador
Es el dueño o responsable del gimnasio. Tiene control total.

**Puede:**
- Aprobar o rechazar solicitudes de membresía de nuevos miembros
- Ver y gestionar todos los miembros (bloquear, cambiar rol, poner fecha de vencimiento de membresía)
- Gestionar coaches
- Configurar los horarios de clases del gym
- Activar la aprobación automática de nuevos miembros
- Ver el progreso de tracking de cualquier miembro

### Coach
Es el entrenador. Diseña los planes y hace el seguimiento.

**Puede:**
- Crear plantillas de rutinas (bloques de días + ejercicios con series, reps, descanso y notas)
- Asignar una plantilla a un miembro con fecha de inicio y fin
- Ver el progreso diario de sus miembros asignados
- Ver el historial completo de rutinas de un miembro y la progresión de peso ejercicio por ejercicio
- Aprobar o rechazar solicitudes de nuevos miembros
- Gestionar horarios de clases

### Miembro
Es la persona que entrena. Usa la app móvil en el día a día.

**Puede:**
- Ver su rutina asignada y completar ejercicios registrando peso, repeticiones y notas
- Ver su historial de rutinas pasadas y la progresión de peso en cada ejercicio
- Consultar los horarios de clases del gym
- Buscar y unirse a gyms por slug
- Pertenecer a múltiples gimnasios simultáneamente

### Admin-Coach
Un rol combinado: tiene los permisos del admin y del coach al mismo tiempo. Útil en gimnasios pequeños donde el dueño también entrena.

---

## ¿Cómo funciona? — Flujo principal

### Desde el gym hacia el miembro

```
1. El admin crea el gym en la plataforma
   └── Configura nombre, descripción y si acepta miembros automáticamente

2. Los miembros se unen
   └── Buscan el gym por su slug (ej: "crossfit-palermo")
   └── Envían solicitud → admin o coach la aprueba

3. El coach crea una plantilla de rutina
   └── Define bloques por día (Día 1 — Pecho, Día 2 — Pierna, etc.)
   └── Agrega ejercicios con series, reps, descanso y notas

4. El coach asigna la plantilla a un miembro
   └── Elige la plantilla + el miembro + fecha de inicio
   └── El miembro la ve al instante en su app

5. El miembro entrena y registra
   └── Abre la app, ve su rutina del día
   └── Al completar un ejercicio registra: peso (kg), reps reales y notas opcionales
   └── El sistema guarda el historial sesión por sesión

6. El coach hace seguimiento
   └── Ve el historial del miembro: todas las rutinas pasadas
   └── Ve la progresión de peso en cada ejercicio
   └── Detecta estancamientos y ajusta la rutina
```

---

## Plataformas

### Panel Web (`sgg-web`)
**¿Quién lo usa?** Admins, Coaches, Superadmins

El panel web es la herramienta de gestión. Se accede desde un navegador de escritorio o móvil. Acá se configura todo el gym: miembros, rutinas, asignaciones, horarios, settings.

**URL de desarrollo:** `dev.drinklen.com.ar`

### App Móvil (`sgg-app`)
**¿Quién la usa?** Miembros

La app es la herramienta de uso diario del miembro. Está diseñada para usarse en el gym mientras se entrena: permite ver la rutina del día, marcar ejercicios como completados con peso y reps, y consultar el historial de progresión.

**Tecnología:** React Native + Expo (iOS y Android)

---

## Funcionalidades actuales

### ✅ Implementado

| Área | Funcionalidad |
|------|---------------|
| Auth | Login/registro nativo (email o username + contraseña) + Google OAuth |
| Auth | Pertenencia a múltiples gimnasios simultáneamente |
| Miembros | Alta, baja, aprobación, bloqueo, cambio de rol, vencimiento de membresía |
| Rutinas | Plantillas con bloques y ejercicios (series, reps, descanso, notas) |
| Rutinas | Asignación a miembros con fecha de inicio y fin opcional |
| Tracking | Completar ejercicios con peso, reps y notas desde la app |
| Tracking | Progreso diario: completados hoy / total de la rutina |
| Historial | Listado de todas las asignaciones pasadas y activas |
| Historial | Detalle por asignación: estadísticas agregadas por ejercicio |
| Historial | Progresión de peso sesión a sesión con gráfico visual |
| Horarios | Gestión de actividades/clases con día, hora de inicio y fin |
| Perfiles | Edición de nombre, avatar; eliminación de cuenta |
| App móvil | Dark mode, safe area, selector de tema (sistema/claro/oscuro) |
| Plataforma | Superadmin: gestión global de gyms y admins |

### 🔜 Planificado / No implementado aún

| Área | Funcionalidad |
|------|---------------|
| Coaching | Asignación formal coach → miembro (módulo `coaching`) |
| Pagos | Cobro de membresías, facturación |
| Notificaciones | Push notifications (recordatorios, aprobaciones) |
| Métricas | Dashboard de adherencia y retención para el admin |
| Exportación | Exportar historial de un miembro en PDF/Excel |

---

## Modelo de negocio

SGG es un SaaS multi-tenant: un único sistema que sirve a múltiples gimnasios. Cada gym tiene sus datos completamente separados de los demás.

**Durante el beta:** acceso gratuito sin límite de miembros ni features.

**Modelo futuro:** suscripción mensual por gimnasio, posiblemente con tiers según cantidad de miembros activos o coaches.

---

## Glosario

| Término | Significado |
|---------|-------------|
| **Gym / Gimnasio** | Una organización dentro de SGG. Tiene su propio conjunto de miembros, coaches y datos |
| **Slug** | Identificador textual único de un gym, usado en URLs y para que los miembros lo encuentren (ej: `crossfit-palermo`) |
| **Plantilla** | Un programa de entrenamiento reutilizable. Define los bloques (días) y ejercicios pero no tiene fecha ni miembro asignado |
| **Asignación** | Una plantilla asignada a un miembro específico con fecha de inicio y fin |
| **Bloque** | Un grupo de ejercicios dentro de una plantilla, generalmente asociado a un día (ej: "Día 1 — Pecho y Tríceps") |
| **Completion** | El registro de un ejercicio completado en una sesión: incluye fecha, peso, reps y notas |
| **Sesión** | Un día en que el miembro entrenó. Un mismo ejercicio puede tener una completion por día |
| **Sobrecarga progresiva** | Principio de entrenamiento que consiste en aumentar gradualmente el peso o volumen para forzar adaptación. SGG la habilita al registrar el peso sesión a sesión |
| **Platform role** | Rol global del usuario en toda la plataforma (`USER` o `SUPERADMIN`). Distinto al rol dentro de un gym específico |
