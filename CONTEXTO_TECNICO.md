# 🚀 Arquitectura y Contexto Técnico Definitivo: Sentinel Core

Este documento contiene el desglose **ABSOLUTAMENTE COMPLETO Y DEFINITIVO** de toda la arquitectura, librerías, dependencias, lógica de negocio, módulos, configuraciones, base de datos y flujos de red de **Sentinel Core**. Es la "Biblia" técnica del proyecto, combinando todo el stack y toda la algoritmia interna.

---

## 🏗️ 1. Visión General de la Arquitectura

Sentinel Core es una plataforma robusta de gestión de tickets y monitoreo de SLA, orientada a mantener un rastro inmutable (Auditoría) de todas las acciones, y diseñada con una arquitectura Cliente-Servidor fuertemente desacoplada.

### Stack Tecnológico Base
- **Frontend**: Single Page Application (SPA) construida con React 19.2.4.
- **Backend**: API RESTful en Node.js utilizando Express 5.2.1 y tipado estricto con TypeScript 6.0.2.
- **Base de Datos**: PostgreSQL 15+ gestionado a través de Prisma ORM v7.7.0.

---

## 🎨 2. Frontend: UI, Dependencias y Peticiones de Red

El frontend no es solo "React", es un ecosistema fuertemente acoplado para brindar feedback inmediato y manejar el estado offline/online de manera eficiente.

### Dependencias y Librerías del Frontend
- **React 19.2.4 & React Router 7.14.1**: Renderizado y enrutamiento SPA basado en roles.
- **Vite 8.0.4**: Herramienta de build y dev server hiper-rápida.
- **Tailwind CSS 4.2.2**: Framework de estilos utilitarios (utility-first) para diseño responsivo.
- **Zustand 5.0.12**: Manejo de estado global extremadamente ligero. Se usa para mantener, por ejemplo, el `useNotificationStore.js` sincronizado sin re-renders innecesarios.
- **Framer Motion 12.38.0**: Motor de físicas y animaciones para micro-interacciones premium (transiciones suaves de listas, modales que rebotan).
- **SweetAlert2 (11.26) & Sonner (2.0.7)**: Sistema dual de notificaciones. SweetAlert para modales críticos destructivos, Sonner para notificaciones toast invisibles en las esquinas.
- **Recharts 3.8.1**: Renderizado de gráficos y métricas (KPIs) en el Dashboard de Administración.
- **XLSX 0.18.5**: Exportación nativa de reportes a Excel sin depender del backend.

### Módulos y Rutas Principales (`src/pages/`)
El enrutamiento separa estrictamente por roles de usuario para evitar fugas de información:
- **Admin**: `AdminDashboard.jsx` (Métricas), `TicketList.jsx` (Listado master con búsqueda "super power"), `UserManagement.jsx`, `AuditLogs.jsx` (Trazabilidad forense), `BackupManager.jsx` (Panel visual de respaldos), `Reports.jsx` (Filtros y exportaciones).
- **Technician**: Vista ultra enfocada en los tickets que tienen asignados. Sin ruido.
- **Requester (Locatarios)**: Vistas simplificadas (`MyTickets`) para levantar y confirmar resolución de tickets sin fricción.

### Manejo de Peticiones y Fetch API (`src/api/client.js`)
El frontend **NO utiliza Axios**. Todo pasa por un wrapper nativo hiper-optimizado sobre `fetch`:
1. **Configuración Base**: Apunta a `VITE_API_URL` (local o producción).
2. **Cookies y Credenciales (`credentials: 'include'`)**: **Esto es CRÍTICO**. Al configurar esto, el navegador adjunta automáticamente las cookies `httpOnly` (que contienen el JWT) en cada petición al backend. No se guarda el token en el inseguro `localStorage`, previniendo ataques XSS (Cross-Site Scripting).
3. **Interceptores Implícitos**: Si `response.ok` es falso, la función base extrae el mensaje de error de la API y lanza un throw estructurado, permitiendo a las vistas atraparlo con un `try/catch` limpio.

---

## ⚙️ 3. Backend: Arquitectura, Node.js, Express y Seguridad

El backend está diseñado como una fortaleza militar: no confía en nada que venga del cliente y valida absolutamente todo.

### Dependencias y Librerías del Backend
- **Express 5.2.1**: Framework enrutador base.
- **Zod 4.3.6**: Esquemas de validación de datos (la fuente única de verdad para tipos estáticos en runtime).
- **Prisma 7.7.0**: El ORM type-safe para interactuar con Postgres.
- **Argon2 0.44.0**: El estándar de oro moderno para hashear contraseñas, resistente a ataques de hardware (GPU/ASIC), superando a Bcrypt.
- **jsonwebtoken (JWT) 9.0.3**: Emisión y validación de tokens sin estado.
- **Express-Rate-Limit & Cors**: Defensas de red a nivel middleware.

### CORS y Middlewares Globales (`app.ts`)
- **CORS (`cors`)**: 
  - `origin: env.CORS_ORIGIN` asegura que solo dominios autorizados toquen la API.
  - `credentials: true`: **Obligatorio** para que Express acepte las cookies que envía el fetch del frontend.
- **Rate Limiting (`express-rate-limit`)**: Limita peticiones masivas (ej. 500 por cada 15 min por IP) para mitigar DDoS básicos y fuerza bruta.
- **Parseadores**: `express.json({ limit: '1mb' })` (bloquea payloads gigantes) y `cookieParser()` (parsea cabeceras de cookies crudas a un objeto utilizable).

### Estrategia de Autenticación (`auth.middleware.ts`)
Implementa un patrón de **Estrategia Dual** brillante:
1. **Prioridad 1 (Cookies `httpOnly`)**: Lee `req.cookies.token`. Es la vía más blindada para la web.
2. **Prioridad 2 (Fallback `Bearer`)**: Si no hay cookie, busca en los headers `Authorization: Bearer <token>`. Esto permite que la misma API sea consumida sin problemas por clientes de escritorio (Tauri puro) o Postman.
- **Inyección**: Tras hacer `jwt.verify`, inyecta el payload en `req.user = { id, email, role }`. El middleware subsecuente (`role.middleware.ts`) usa esto para proteger rutas preguntando `if (req.user.role !== 'ADMIN') throw Error`.

### Validaciones Implacables (`validate.middleware.ts` y Zod)
Los controladores de ruta jamás validan la data manualmente. Todo pasa por el middleware de Zod:
1. Recibe un esquema tipado estricto (ej. `createUserSchema`).
2. Usa `schema.safeParse(req.body)`. Si falla, escupe un 400 Bad Request formateado con exactamente los campos inválidos.
3. **Sanitización Letal**: Si pasa, hace `req.body = result.data`. Esto significa que si el frontend mandó `{ email: "x", password: "y", role: "ADMIN_INJECTED" }` y el rol no estaba en el esquema de Zod, ese campo indeseado es decapitado y destruido antes de llegar a la lógica de negocio.

---

## 🧠 4. Lógica de Negocio y Flujos Core (`src/services/`)

Toda la "magia" y reglas de oro empresariales ocurren en la capa de servicios. Ningún controlador toma decisiones.

### A. Algoritmo de Creación y Auto-Asignación ("Least Connections")
Al crear un ticket (`ticket.service.ts`):
1. **Prevención de XSS**: Pasa por `sanitizeTicketInput` para limpiar tags HTML.
2. **SLA Automático**: Calcula la fecha límite (`dueDate`) basada en los `slaHours` de la categoría (`Category`). Ej: Categoría Eléctrica = Crítico = 4 horas.
3. **AutoAssign**: Busca todos los técnicos activos que pertenezcan al mismo departamento de la categoría. Cuenta cuántos tickets activos (que no sean RESOLVED ni CLOSED) tiene cada uno, y **se lo clava al que tiene menos tickets**.
4. Dispara el estado de `OPEN` a `ASSIGNED` y genera logs de auditoría y notificaciones.

### B. Ciclo Quirúrgico de Resolución y Confirmación
Los técnicos tienen prohibido cerrar tickets de forma unilateral.
1. **`resolveWithNote` (Técnico)**: El técnico asignado pasa el ticket de `IN_PROGRESS` a `AWAITING_CONFIRMATION`. Obligatoriamente debe escribir una `resolutionNote` explicando el arreglo (mínimo 10 caracteres).
2. **`confirmTicket` (Locatario)**: El creador del ticket recibe notificación y revisa.
   - **Confirma**: El ticket pasa a `CLOSED` de forma definitiva (sin sistema de estrellas, para fluidez).
   - **Rechaza**: Exige un comentario de por qué falló, y el ticket "rebota" de regreso a `IN_PROGRESS`, notificando al técnico que su trabajo fue devuelto.

### C. Reasignaciones de Tickets
- **`reassignTechnician`**: El Admin borra el registro de la tabla puente `Assignment` actual y lo liga al nuevo técnico.
- La tabla de `AuditLog` atrapa esto guardando quién era el técnico anterior y quién es el nuevo. El estado del ticket se mantiene intacto (si estaba en progreso, sigue en progreso), a menos que estuviera virgen en `OPEN`, donde se fuerza a `ASSIGNED`.

### D. Módulo Bare-Metal de Backups Físicos (`backup.service.ts`)
Diseñado para la infraestructura 100% offline sin dependencias cloud (AWS/S3):
- Usa `child_process.exec` de Node.js para interactuar directamente con los binarios del sistema operativo (`pg_dump` y `psql`).
- Para evitar crasheos de PostgreSQL, limpia la URL de Prisma quitando argumentos conflictivos (como `?schema=public`).
- Ejecuta `pg_dump` con flags `--clean --no-owner` para máxima compatibilidad y portabilidad.
- Genera archivos físicos `.sql` en el disco local (`/backups`), permitiendo listar, eliminar y restaurar la base de datos entera al vuelo con un click desde el panel del Administrador.

---

## 🗄️ 5. Base de Datos y ORM (Prisma + PostgreSQL)

Base de datos altamente relacional y normalizada en PostgreSQL 15, estructurada con `schema.prisma`.

### Entidades y Relaciones (Diagrama Mental)
- **Users**: Tipados por `Role` (`ADMIN`, `TECHNICIAN`, `REQUESTER`). Los técnicos tienen asignado un `Department` (PLOMERIA, REDES, etc.).
- **Categories**: Contienen el SLA (tiempo máximo de resolución en horas) y su departamento correspondiente.
- **Tickets**: Centro del universo. Tienen creador (`creatorId`), categoría, estado, prioridad y ubicación.
- **Assignments**: Tabla Pivote (Relación M:N). Maneja `ticketId` y `technicianId`. Permite saber quiénes tienen qué tickets y facilita la reasignación borrando la tupla vieja y creando una nueva.
- **Comments**: Mensajes cruzados. Soportan `isInternal` para que los técnicos hablen entre ellos sin que el Locatario lo vea.

### Auditoría Forense (`audit.service.ts`)
Literalmente **NINGÚN** cambio crítico ocurre sin escribirse en la tabla `AuditLog` (Trazabilidad estricta):
- Guarda el `userId` (quién gatilló la acción).
- Guarda la `action` (STATUS_CHANGE, REASSIGNMENT, TICKET_CREATED).
- Guarda `oldValue` y `newValue`.
*Objetivo:* Si ocurre un incidente en el centro comercial, el Admin puede ver la línea de tiempo forense milisegundo a milisegundo en el panel web.

### Notificaciones Push-Style (`notification.service.ts`)
Cada cambio muta la tabla `Notification` con `userId`, `message`, `type` e `isRead: false`. El backend las emite, y el frontend, a través de Zustand (`useNotificationStore`), las pinta en la campanita con *deeplinking* (`link`), lo que significa que al hacer click, la URL lleva al usuario directo a la vista del ticket involucrado.
