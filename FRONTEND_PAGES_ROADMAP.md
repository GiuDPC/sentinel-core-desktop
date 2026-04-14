# Roadmap de Páginas del Frontend — Plataforma de Gobernanza Digital

## Resumen Ejecutivo

frontend/src/
├── main.jsx # Entry point (ya existe)
├── App.jsx # Router principal (CAMBIAR)
├── api/
│ └── client.js # Cliente HTTP ( NUEVO )
├── context/
│ └── AuthContext.jsx # Estado de auth ( NUEVO )
├── components/
│ ├── Layout.jsx # Layout principal ( NUEVO )
│ ├── ProtectedRoute.jsx # Protección de rutas ( NUEVO )
│ ├── Header.jsx # Header con usuario ( NUEVO )
│ └── Sidebar.jsx # Menú lateral ( NUEVO )
├── pages/
│ ├── Login.jsx # Login ( NUEVO )
│ ├── Register.jsx # Registro ( NUEVO )
│ ├── Dashboard.jsx # Dashboard con métricas ( NUEVO )
│ ├── TicketList.jsx # Lista de tickets ( NUEVO )
│ ├── TicketDetail.jsx # Detalle de ticket ( NUEVO )
│ ├── CreateTicket.jsx # Crear ticket ( NUEVO )
│ ├── MyTickets.jsx # Mis tickets ( NUEVO )
│ ├── MyAssignments.jsx # Mis asignaciones ( NUEVO )
│ ├── Profile.jsx # Perfil usuario ( NUEVO )
│ ├── AdminUsers.jsx # Admin: usuarios ( NUEVO )
│ ├── AdminCategories.jsx # Admin: categorías ( NUEVO )
│ ├── AdminTechnicians.jsx # Admin: workload ( NUEVO )
│ └── Reports.jsx # Reportes ( NUEVO )
├── hooks/
│ ├── useAuth.js # Hook de auth ( NUEVO )
│ └── useTickets.js # Hook de tickets ( NUEVO )
├── utils/
│ ├── api.js # Funciones helper ( NUEVO )
│ ├── date.js # Fechas formateadas ( NUEVO )
│ └── auth.js # Helper auth ( NUEVO )
└── styles/
└── global.css # Estilos globales ( NUEVO )

Este documento define el roadmap completo de páginas y requisitos para el frontend de Sentinel-Core, basado en el análisis del backend existente. El sistema es una **Plataforma de Gobernanza Digital** que gestiona tickets con flujo de trabajo formal, medible y auditable.

**Estado Actual**:

- ✅ Backend: Completamente implementado (Express + Prisma + TypeScript)
- ⚠️ Frontend: Template básico de Vite + React (sin páginas reales)
- 🎯 Objetivo: Crear las páginas necesarias para consumir la API del backend

---

## 1. Estructura de Rutas y Páginas

### 1.1 Routes Públicas (Sin Autenticación)

| Ruta        | Página   | Descripción                           |
| ----------- | -------- | ------------------------------------- |
| `/login`    | Login    | Página de autenticación               |
| `/register` | Registro | Página de registro de nuevos usuarios |

### 1.2 Routes Protegidas (Requiere Autenticación)

| Ruta                | Página                | Descripción                               |
| ------------------- | --------------------- | ----------------------------------------- |
| `/`                 | Dashboard             | Panel principal con métricas y overview   |
| `/tickets`          | Lista de Tickets      | Listado filtrable de todos los tickets    |
| `/tickets/new`      | Crear Ticket          | Formulario para nuevo ticket              |
| `/tickets/:id`      | Detalle de Ticket     | Vista completa con comentarios y adjuntos |
| `/tickets/:id/edit` | Editar Ticket         | Formulario para modificar ticket          |
| `/mis-tickets`      | Mis Tickets           | Tickets creados por el usuario actual     |
| `/mis-asignaciones` | Mis Asignaciones      | Tickets asignados al técnico actual       |
| `/perfil`           | Perfil                | Perfil del usuario actual                 |
| `/admin/usuarios`   | Gestión de Usuarios   | CRUD de usuarios (solo Admin)             |
| `/admin/tecnicos`   | Carga de Técnicos     | Vista de workload de técnicos             |
| `/admin/categorias` | Gestión de Categorías | CRUD de categorías (solo Admin)           |
| `/admin/roles`      | Gestión de Roles      | CRUD de roles (solo Admin)                |
| `/reportes`         | Reportes              | Dashboard de métricas y analytics         |
| `/configuracion`    | Configuración         | Configuración del sistema (solo Admin)    |

---

## 2. Requisitos Detallados por Página

### 2.1 Página de Login (`/login`)

**Propósito**: Autenticar usuarios en el sistema

**API Endpoints Consumidos**:

- `POST /api/auth/login` — Autenticación con email/password

**Campos del Formulario**:

- Email (validación: formato email, requerido)
- Contraseña (mínimo 8 caracteres, requerido)
- "Recordarme" checkbox

**Comportamiento**:

- Validación en tiempo real
- Loading state durante autenticación
- Redirección a `/` tras login exitoso
- Guardar JWT en cookie (HTTP-only)
- Mostrar errores de autenticación

** Casos Edge**:

- Usuario inactivo: Mostrar mensaje específico
- Credenciales incorrectas: Mensaje genérico por seguridad
- Sesión expirada: Redireccionar a login

---

### 2.2 Página de Registro (`/register`)

**Propósito**: Crear nuevos usuarios en el sistema

**API Endpoints Consumidos**:

- `POST /api/auth/register` — Registro de nuevo usuario

**Campos del Formulario**:

- Nombre (requerido, mínimo 2 caracteres)
- Apellido (requerido, mínimo 2 caracteres)
- Email (validación: formato email, único)
- Contraseña (mínimo 8 caracteres, debe incluir número y letra)
- Confirmar contraseña (debe coincidir)
- Teléfono (opcional)
- Departamento (opcional, dropdown)

**Comportamiento**:

- Validación en tiempo real
- Chequeo de disponibilidad de email (on blur)
- Loading state durante registro
- Redirección a `/login` con mensaje de éxito
- Email de activación (si está implementado)

---

### 2.3 Dashboard (`/`)

**Propósito**: Vista principal con métricas y overview del sistema

**API Endpoints Consumidos**:

- `GET /api/metrics/dashboard` — Métricas principales
- `GET /api/metrics/sla-breached` — Tickets con SLA vencido
- `GET /api/tickets?limit=5&sort=createdAt:desc` — Tickets recientes

**Componentes Requeridos**:

| Componente    | Descripción                                                  |
| ------------- | ------------------------------------------------------------ |
| StatsCards    | 4 cards: Abiertos, En Progreso, Resueltos Hoy, Mi Pendientes |
| SLAAlert      | Alerta de tickets con SLA vencido (color rojo)               |
| RecentTickets | Lista de 5-10 tickets recientes                              |
| QuickActions  | Botones: "Nuevo Ticket", "Ver Mis Tickets"                   |
| PriorityChart | Gráfico de distribución por prioridad                        |
| StatusChart   | Gráfico de torta por estado                                  |

**Datos a Mostrar**:

- Total de tickets por estado
- Tickets creados hoy
- Tiempo promedio de resolución
- Porcentaje de cumplimiento de SLA
- Distribución por prioridad

**Filtros de Fecha**:

- Hoy, Esta Semana, Este Mes, Personalizado

---

### 2.4 Lista de Tickets (`/tickets`)

**Propósito**: Mostrar todos los tickets con filtros y búsqueda

**API Endpoints Consumidos**:

- `GET /api/tickets` — Listado con filtros
- `GET /api/categories` — Para filtros de categoría
- `GET /api/users/technicians` — Para filtros de técnico

**Parámetros de Query Soportados**:

- `status` — Filtrar por estado
- `priority` — Filtrar por prioridad
- `categoryId` — Filtrar por categoría
- `assignedTo` — Filtrar por técnico
- `search` — Búsqueda en título/descripción
- `page` — Número de página
- `limit` — Elementos por página
- `sort` — Ordenación (createdAt, priority, status)

**Componentes Requeridos**:

| Componente   | Descripción                                           |
| ------------ | ----------------------------------------------------- |
| SearchBar    | Búsqueda global por código, título                    |
| FilterPanel  | Filtros: estado, prioridad, categoría, técnico, fecha |
| TicketsTable | Tabla interactiva con columnas sortable               |
| Pagination   | Paginación con salto de página                        |
| BulkActions  | Acciones: cambiar estado, reasignar, exportar         |
| NewTicketBtn | Botón principal "Nuevo Ticket"                        |

**Columnas de la Tabla**:

| Columna     | Ancho | Ordenable |
| ----------- | ----- | --------- |
| Código      | 120px | ✅        |
| Título      | auto  | ✅        |
| Estado      | 100px | ✅        |
| Prioridad   | 90px  | ✅        |
| Categoría   | 120px | ✅        |
| Técnico     | 150px | ✅        |
| Creado      | 120px | ✅        |
| Vencimiento | 120px | ✅        |
| Acciones    | 80px  | ❌        |

**Estados con Colores Badge**:

- 🔵 OPEN — Azul
- 🟠 ASSIGNED — Naranja
- 🟡 IN_PROGRESS — Amarillo
- ⚪ ON_HOLD — Gris
- 🟢 RESOLVED — Verde
- 🔒 CLOSED — Verde oscuro

**Prioridades con Colores**:

- 🔴 CRITICAL — Rojo
- 🟠 HIGH — Naranja
- 🟡 MEDIUM — Amarillo
- ⚪ LOW — Gris

---

### 2.5 Crear Ticket (`/tickets/new`)

**Propósito**: Formulario para crear un nuevo ticket

**API Endpoints Consumidos**:

- `POST /api/tickets` — Crear ticket
- `GET /api/categories` — Listar categorías para el dropdown

**Campos del Formulario**:

| Campo        | Tipo     | Requerido | Validación                 |
| ------------ | -------- | --------- | -------------------------- |
| Título       | text     | ✅        | 5-200 caracteres           |
| Descripción  | textarea | ✅        | 20-5000 caracteres         |
| Categoría    | select   | ✅        | Selección válida           |
| Prioridad    | select   | ✅        | LOW/MEDIUM/HIGH/CRITICAL   |
| Ubicación    | text     | ✅        | 3-200 caracteres           |
| Fecha Límite | date     | ❌        | >= fecha actual            |
| Adjuntos     | file     | ❌        | Imágenes/PDF, máx 10MB c/u |

**Comportamiento**:

- Fecha límite sugerida automáticamente según SLA de la categoría
- Preview de archivos antes de subir
- Progress bar durante upload
- Validación inline en tiempo real
- Preview del ticket antes de crear
- Redirección a Detalle del Ticket tras crear

---

### 2.6 Detalle del Ticket (`/tickets/:id`)

**Propósito**: Vista completa de un ticket con toda su información

**API Endpoints Consumidos**:

- `GET /api/tickets/:id` — Datos del ticket
- `GET /api/tickets/:id/comments` — Comentarios
- `GET /api/tickets/:id/attachments` — Adjuntos
- `GET /api/tickets/:id/audit-log` — Historial de cambios
- `POST /api/tickets/:id/comments` — Agregar comentario
- `PATCH /api/tickets/:id` — Actualizar ticket
- `POST /api/tickets/:id/attachments` — Subir archivo

**Secciones de la Página**:

| Sección           | Descripción                                                  |
| ----------------- | ------------------------------------------------------------ |
| Header            | Código ticket, estado badge, prioridad, acciones principales |
| Info Principal    | Título, descripción, ubicación, categoría                    |
| Fechas            | Creado, actualizado, fecha límite, tiempo total              |
| Asignación        | Técnico asignado, historial de asignaciones                  |
| Timeline/AuditLog | Lista cronológica de todos los cambios                       |
| Comentarios       | Sección de comentarios internos y externos                   |
| Adjuntos          | Listado de archivos con descarga y upload                    |

**Comentarios**:

- Comentarios internos (solo técnicos/admin) — Icono de candado
- Comentarios externos (todos) — Icono estándar
- Timestamp y usuario que publicó
- Opción de editar/eliminar propios

**AuditLog ( Gobernanza )**:

- Ação realizada
- Usuario que la realizó
- Valor anterior y nuevo
- Timestamp exacto

**Acciones Disponibles** (según rol):

- Cambiar estado
- Reasignar técnico
- Agregar comentario
- Subir/eliminar adjuntos
- Editar información
- Cerrar ticket

---

### 2.7 Mis Tickets (`/mis-tickets`)

**Propósito**: Tickets creados por el usuario actual

**API Endpoints Consumidos**:

- `GET /api/tickets?creatorId={userId}` — Tickets del usuario

**Diferencias con Lista General**:

- Solo muestra tickets donde el usuario es creador
- Filtros reducidos (estado, prioridad, fecha)
- No hay acciones masivas
- Solo puede ver sus propios tickets

---

### 2.8 Mis Asignaciones (`/mis-asignaciones`)

**Propósito**: Tickets asignados al técnico actual

**API Endpoints Consumidos**:

- `GET /api/tickets?assignedTo={userId}` — Tickets asignados

**Características**:

- Vista similar a Lista de Tickets pero filtrada
- Accionesquick para cambiar estado
- Indicador visual de tickets vencidos
- Orden por prioridad y fecha límite

---

### 2.9 Perfil de Usuario (`/perfil`)

**Propósito**: Ver y editar información del usuario actual

**API Endpoints Consumidos**:

- `GET /api/users/me` — Datos del usuario actual
- `PATCH /api/users/me` — Actualizar perfil

**Campos Editables**:

- Nombre
- Apellido
- Teléfono
- Departamento
- Contraseña (con verificación de actual)

**Campos Solo Lectura**:

- Email
- Rol
- Fecha de creación

---

### 2.10 Gestión de Usuarios (`/admin/usuarios`) — Solo Admin

**Propósito**: CRUD completo de usuarios

**API Endpoints Consumidos**:

- `GET /api/users` — Listar usuarios
- `GET /api/users/:id` — Ver usuario específico
- `POST /api/users` — Crear usuario
- `PATCH /api/users/:id` — Actualizar usuario
- `DELETE /api/users/:id` — Desactivar usuario

**Componentes**:

- Tabla de usuarios con filtros
- Modal de creación/edición
- Historial de actividad del usuario

**Columnas de la Tabla**:

| Columna          | Descripción        |
| ---------------- | ------------------ |
| Nombre           | Nombre completo    |
| Email            | Email del usuario  |
| Rol              | Rol actual (badge) |
| Departamento     | Departamento       |
| Estado           | Activo/Inactivo    |
| Tickets Creados  | Cantidad           |
| Última Actividad | Fecha              |
| Acciones         | Editar, Desactivar |

---

### 2.11 Carga de Técnicos (`/admin/tecnicos`) — Solo Admin

**Propósito**: Ver distribución de trabajo entre técnicos

**API Endpoints Consumidos**:

- `GET /api/tickets/technicians/workload` — Carga de trabajo

**Componentes**:

- Cards por técnico con количecko de tickets asignados
- Gráfico de barras de workload
- Lista de tickets por técnico
- Indicador de sobrecarga (más de 10 tickets activos)

---

### 2.12 Gestión de Categorías (`/admin/categorias`) — Solo Admin

**Propósito**: CRUD de categorías con configuración de SLA

**API Endpoints Consumidos**:

- `GET /api/categories` — Listar categorías
- `POST /api/categories` — Crear categoría
- `PATCH /api/categories/:id` — Actualizar categoría
- `DELETE /api/categories/:id` — Desactivar categoría

**Campos del Formulario**:

- Nombre (único)
- SLA en horas
- Estado (activo/inactivo)

---

### 2.13 Gestión de Roles (`/admin/roles`) — Solo Admin

**Propósito**: CRUD de roles del sistema

**API Endpoints Consumidos**:

- `GET /api/roles` — Listar roles
- `POST /api/roles` — Crear rol
- `PATCH /api/roles/:id` — Actualizar rol
- `DELETE /api/roles/:id` — Eliminar rol

**Nota**: En el schema actual solo hay tabla `roles`, no hay endpoint específico. Puede necesitar implementación.

---

### 2.14 Reportes (`/reportes`)

**Propósito**: Dashboard de analytics y métricas

**API Endpoints Consumidos**:

- `GET /api/metrics/dashboard` — Métricas generales
- `GET /api/metrics/sla-breached` — SLA vencido
- `GET /api/metrics/resolution-time` — Tiempos de resolución
- `GET /api/metrics/tickets-by-category` — Por categoría
- `GET /api/metrics/tickets-by-technician` — Por técnico

**Gráficos Requeridos**:

| Gráfico                       | Tipo                | Descripción                  |
| ----------------------------- | ------------------- | ---------------------------- |
| Tickets por Estado            | Torta               | Distribución actual          |
| Tickets por Prioridad         | Barras              | Distribución por prioridad   |
| Tendencia Semanal             | Línea               | Tickets creados vs resueltos |
| Cumplimiento de SLA           | Gauge               | Porcentaje de cumplimiento   |
| Tiempo Promedio por Categoría | Barras              | Comparativo                  |
| Workload por Técnico          | Barras horizontales | Distribución de carga        |

**Opciones de Exportación**:

- PDF con gráficos
- Excel con datos tabulares

---

### 2.15 Configuración (`/configuracion`) — Solo Admin

**Propósito**: Configuración general del sistema

**Secciones**:

- Información de la organización
- Configuración de emails/notificaciones
- Parámetros de SLA
- Políticas de tickets

---

## 3. Sistema de Roles y Permisos

### 3.1 Roles Definidos en el Backend

| Rol            | Descripción               | Acceso                                               |
| -------------- | ------------------------- | ---------------------------------------------------- |
| **ADMIN**      | Administrador del sistema | Todas las páginas y acciones                         |
| **TECHNICIAN** | Técnico de soporte        | Tickets asignados, comentarios, cambio de estado     |
| **REQUESTER**  | Solicitante/Creador       | Crear tickets, ver mis tickets, comentarios externos |

### 3.2 Matriz de Permisos por Página

| Página                | ADMIN | TECHNICIAN    | REQUESTER   |
| --------------------- | ----- | ------------- | ----------- |
| Login/Register        | ✅    | ✅            | ✅          |
| Dashboard             | ✅    | ✅            | ✅          |
| Lista de Tickets      | ✅    | Ver asignados | Ver propios |
| Crear Ticket          | ✅    | ✅            | ✅          |
| Detalle de Ticket     | ✅    | Asignados     | Propios     |
| Mis Tickets           | ✅    | ✅            | ✅          |
| Mis Asignaciones      | ❌    | ✅            | ❌          |
| Perfil                | ✅    | ✅            | ✅          |
| Gestión de Usuarios   | ✅    | ❌            | ❌          |
| Gestión de Técnicos   | ✅    | ❌            | ❌          |
| Gestión de Categorías | ✅    | ❌            | ❌          |
| Gestión de Roles      | ✅    | ❌            | ❌          |
| Reportes              | ✅    | Solo propios  | ❌          |
| Configuración         | ✅    | ❌            | ❌          |

---

## 4. Requisitos Técnicos del Frontend

### 4.1 Dependencias Recomendadas

| Paquete               | Propósito      | Versión Sugerida |
| --------------------- | -------------- | ---------------- |
| react-router-dom      | Routing        | ^6.x             |
| @tanstack/react-query | Estado de API  | ^5.x             |
| axios                 | Cliente HTTP   | ^1.x             |
| tailwindcss           | Estilos        | ^3.x             |
| react-hook-form       | Formularios    | ^7.x             |
| zod                   | Validación     | ^3.x             |
| recharts              | Gráficos       | ^2.x             |
| react-hot-toast       | Notificaciones | ^2.x             |
| lucide-react          | Iconos         | ^0.x             |
| date-fns              | Fechas         | ^3.x             |

### 4.2 Estructura de Archivos Sugerida

```
frontend/src/
├── api/                    # Cliente API
│   ├── axios.ts
│   ├── auth.ts
│   ├── tickets.ts
│   ├── users.ts
│   └── metrics.ts
├── components/              # Componentes reutilizables
│   ├── ui/                 # Componentes base
│   ├── layout/             # Layout, Header, Sidebar
│   ├── tickets/            # Componentes de tickets
│   └── common/             # Botones, Inputs, etc
├── pages/                  # Páginas
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── TicketList.tsx
│   ├── TicketDetail.tsx
│   ├── CreateTicket.tsx
│   ├── UserManagement.tsx
│   ├── Reports.tsx
│   └── ...
├── hooks/                  # Custom hooks
│   ├── useAuth.ts
│   ├── useTickets.ts
│   └── ...
├── context/                # Contextos de React
│   ├── AuthContext.tsx
│   └── ...
├── types/                  # TypeScript types
│   ├── user.ts
│   ├── ticket.ts
│   └── ...
├── utils/                  # Utilidades
│   ├── formatters.ts
│   └── validators.ts
├── App.tsx                 # Componente principal
└── main.tsx                # Entry point
```

---

## 5. Flujo de Autenticación

### 5.1 Login Flow

```
1. Usuario entra a /login
2. Ingresa email y contraseña
3. Click en "Iniciar Sesión"
4. Llamada a POST /api/auth/login
5. Backend retorna JWT en cookie
6. Frontend redirige a /
7. Cargar datos del usuario desde /api/users/me
8. Guardar en AuthContext
9. Mostrar Dashboard
```

### 5.2 Protección de Rutas

```typescript
// Estructura de protección
- Rutas públicas: /login, /register
- Rutas protegidas: todas las demás
- Verificar JWT en cada request (interceptor)
- Redirect a /login si no autenticado
- Verificar rol para rutas admin
```

---

## 6. Consideraciones de UX/UI

### 6.1 Diseño Visual

- **Paleta de Colores**:
  - Primario: Azul institucional (#1E40AF)
  - Secundario: Gris (#6B7280)
  - Éxito: Verde (#059669)
  - Advertencia: Amarillo (#D97706)
  - Error: Rojo (#DC2626)
  - Fondo: Gris claro (#F3F4F6)

- **Tipografía**: Sistema de fuentes profesional (Inter, Roboto, o similar)

- **Espaciado**: Escala de 4px (4, 8, 12, 16, 24, 32, 48, 64)

### 6.2 Componentes Requeridos

- Badge/Tag para estados y prioridades
- Table con sorting y pagination
- Modal para confirmaciones
- Toast notifications para feedback
- Skeleton loaders para loading states
- Form inputs con validación visual
- File upload con drag & drop
- Date picker para fechas

### 6.3 Accesibilidad

- Labels en todos los inputs
  -ARIA labels en iconos interactivos
- Keyboard navigation
- Contraste de colores WCAG AA
- Screen reader friendly

---

## 7. Próximos Pasos de Implementación

### Fase 1: Fundamentos

- [ ] Configurar React Router
- [ ] Implementar AuthContext y protección de rutas
- [ ] Crear cliente API con axios
- [ ] Implementar Login y Register

### Fase 2: Core Features

- [ ] Dashboard con métricas
- [ ] Lista de tickets con filtros
- [ ] Crear ticket
- [ ] Detalle de ticket con comentarios

### Fase 3: Gestión

- [ ] Gestión de usuarios (Admin)
- [ ] Gestión de categorías (Admin)
- [ ] Gestión de técnicos

### Fase 4: Reportes y Extras

- [ ] Página de reportes
- [ ] Exportación PDF/Excel
- [ ] Notificaciones
- [ ] Mejoras de UX

---

## 8. Notas del Roadmap

- Este roadmap fue generado basado en el análisis del schema de Prisma y los endpoints de la API del backend
- Algunas rutas de API mentioned pueden requerir verificación o ajuste
- Los roles exactos deben verificarse en la tabla `roles` de la base de datos
- La implementación debe seguir el flujo SDD: Spec → Design → Tasks → Apply → Verify

---

_Documento generado automáticamente — Sentinel-Core Digital Governance Platform_
_Fecha: Abril 2026_
