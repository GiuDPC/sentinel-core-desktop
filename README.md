# Sentinel Core Desktop — Gestión de Tickets para Centro Comercial

<div align="center">

![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)
![Rust](https://img.shields.io/badge/Rust-1.85+-DEA584?style=flat-square&logo=rust)
![Tauri](https://img.shields.io/badge/Tauri-2.11.1-FFC131?style=flat-square&logo=tauri)
![Vite](https://img.shields.io/badge/Vite-8.0.4-646CFF?style=flat-square&logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4.2.2-38BDF8?style=flat-square&logo=tailwindcss)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite)
![Zustand](https://img.shields.io/badge/Zustand-5-433E38?style=flat-square)

</div>

---

## 📋 Descripción

Sentinel Core Desktop es una **aplicación nativa de escritorio** para la gestión de tickets y monitoreo de SLA en centros comerciales. Es la versión desktop de [Sentinel Core Web](https://github.com/GiuDPC/sentinel-core), migrada a **Tauri v2 + Rust + SQLite**, diseñada para funcionar en equipos de **hasta 2 GB de RAM**.

### Problema que Resuelve

| Problema | Solución |
|----------|----------|
| Reportes verbales sin registro | Sistema digital con trazabilidad completa |
| Sin métricas de rendimiento | SLA automático + dashboards en tiempo real |
| Asignación opaca de técnicos | Vista de carga de trabajo + asignación inteligente |
| Incidentes duplicados | Búsqueda full-text + filtros combinados |
| Sin auditoría | Trail de auditoría inmutable por ticket |

---

## 🚀 Stack Tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 19.2.4 | UI components |
| Vite | 8.0.4 | Build tool & dev server |
| Tailwind CSS | 4.2.2 | Estilos utility-first |
| React Router | 7.14.1 | Enrutamiento (HashRouter) |
| Zustand | 5.0.12 | Estado global (notificaciones) |
| Framer Motion | 12.38.0 | Animaciones |
| Recharts | 3.8.1 | Gráficos dashboard |
| Sonner | 2.0.7 | Toasts |
| SweetAlert2 | 11.26.24 | Modales |
| Lucide React | 1.14.0 | Iconos SVG |

### Backend (Rust/Tauri)

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Tauri | 2.11.1 | Framework desktop nativo |
| Rust | 2021 edition | Lenguaje backend |
| SQLx | 0.8.6 | ORM asíncrono para SQLite |
| Tokio | 1.52.3 | Runtime asíncrono |
| Argon2 | 0.5 | Hashing de contraseñas |
| SQLite | WAL mode | Base de datos embebida |
| Chrono | 0.4 | Manejo de fechas SLA |

### Plugins Tauri

- `tauri-plugin-store` — Persistencia de sesión
- `tauri-plugin-notification` — Notificaciones nativas
- `tauri-plugin-dialog` — Diálogos de sistema
- `tauri-plugin-process` — Gestión de procesos

---

## 📁 Estructura del Proyecto

```
sentinel-core-desktop/
├── frontend/                     # React SPA
│   ├── src/
│   │   ├── api/                  # Llamadas IPC a Rust (11 módulos)
│   │   ├── components/
│   │   │   ├── auth/             # Login/Register forms
│   │   │   ├── common/           # ProtectedRoute, LoadingSpinner
│   │   │   ├── dashboard/        # KPIs y gráficos
│   │   │   ├── layout/           # Sidebar, Header, MainLayout
│   │   │   └── ui/               # Button, Input, Modal, Sonner
│   │   ├── Contexts/             # AuthContext (Provider + Object)
│   │   ├── hooks/                # Custom hooks
│   │   ├── pages/                # Vistas por rol
│   │   │   ├── admin/            # Admin dashboard, tickets, users, etc.
│   │   │   ├── requester/        # Mis tickets, crear ticket
│   │   │   └── technician/       # Tickets asignados, detalle
│   │   ├── routes/               # HashRouter + lazy loading
│   │   ├── store/                # Zustand store (notificaciones)
│   │   └── constants/            # Estados, roles, colores
│   ├── vite.config.js
│   └── package.json
│
├── src-tauri/                    # Backend Rust
│   ├── src/
│   │   ├── main.rs               # Entry point
│   │   ├── lib.rs                # Tauri builder + setup DB
│   │   ├── commands/             # 11 módulos IPC (~40 comandos)
│   │   │   ├── auth.rs           # Login, register, perfil
│   │   │   ├── tickets.rs        # CRUD tickets + state machine
│   │   │   ├── assignments.rs    # Asignar/reasignar técnicos
│   │   │   ├── categories.rs     # CRUD categorías con SLA
│   │   │   ├── users.rs          # Gestión de usuarios
│   │   │   ├── comments.rs       # Comentarios en tickets
│   │   │   ├── notifications.rs  # Notificaciones
│   │   │   ├── metrics.rs        # KPIs del dashboard
│   │   │   ├── audit.rs          # Trail de auditoría
│   │   │   ├── diagnostics.rs    # Estado DB, reset
│   │   │   └── backups.rs        # Backup/restore SQLite
│   │   ├── models.rs             # 20+ modelos serde
│   │   ├── errors.rs             # AppError + conversiones
│   │   ├── sla.rs                # Calculadora SLA
│   │   ├── state_machine.rs      # Máquina de estados tickets
│   │   └── seed.rs               # Datos de prueba (35 tickets)
│   ├── migrations/               # Schema SQLite inicial
│   ├── icons/                    # Iconos multi-plataforma
│   └── tauri.conf.json
│
├── .github/workflows/            # CI/CD (Windows + Linux)
└── README.md
```

---

## 📊 Modelo de Datos

```sql
roles (1:N) → users (1:N) → tickets (M:N) → assignments (technician)
                                ├── comments
                                ├── notifications
                                └── audit_logs
```

### Estados del Ticket

```
OPEN → ASSIGNED → IN_PROGRESS → ON_HOLD (↻ IN_PROGRESS)
                               → RESOLVED → AWAITING_CONFIRMATION → CLOSED
                                                                  → IN_PROGRESS (rechazo)
```

### Roles

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| ADMIN | Administrador centro comercial | Todos los tickets, usuarios, categorías, reportes, backups |
| TECHNICIAN | Técnico de mantenimiento | Tickets asignados, actualizar estado, resolver |
| REQUESTER | Locatario del centro comercial | Crear tickets, mis tickets, confirmar resolución |

---

## ⚙️ Instalación y Desarrollo

### Prerrequisitos

- **Rust** 1.85+ (`rustup`)
- **Node.js** 20+ (LTS)
- **Tauri CLI v2**: `npm install -g @tauri-apps/cli`
- **Linux**: `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, `libssl-dev`

### Dev

```bash
# Clonar
git clone https://github.com/GiuDPC/sentinel-core-desktop.git
cd sentinel-core-desktop

# Frontend
cd frontend && npm install && cd ..

# Iniciar dev (Tauri + Vite hot-reload)
npm run tauri dev
```

### Build

```bash
# Windows: genera MSI + NSIS
npm run tauri build -- --targets msi nsis

# Linux: genera deb + AppImage
npm run tauri build -- --targets deb appimage
```

### Seed Data

La primera vez que se inicia la app, se crea automáticamente la base de datos con datos de prueba:

| Tipo | Cantidad | Credenciales |
|------|----------|--------------|
| Admins | 2 | `admin@sentinel.local` / `SentinelAdmin2026!` |
| Técnicos | 5 | `carlos.perez@sentinel.local` / `Tecnico2026!` |
| Locatarios | 8 | `ana.martinez@sentinel.local` / `Locatario2026!` |
| Tickets | 35 | En varios estados (OPEN, ASSIGNED, IN_PROGRESS, etc.) |

---

## 🧪 Testing

```bash
cd frontend && npm test           # Vitest
cd src-tauri && cargo test        # Rust tests
```

---

## 🔧 CI/CD

GitHub Actions automatiza:

1. **Check** — ESLint + Clippy + compile check
2. **Windows** — Build MSI + NSIS installers
3. **Linux** — Build deb + AppImage

Los artifacts se suben como instalables listos para distribuir.

---

## 📦 Requisitos de Sistema

| Plataforma | Mínimo | Recomendado |
|------------|--------|-------------|
| Windows | Windows 10 1809+ | Windows 11 |
| Linux | Ubuntu 22.04+ | Ubuntu 24.04+ |
| RAM | 2 GB | 4 GB+ |
| Disco | 500 MB | 1 GB+ |
| WebView2 | Bootstrapper (descarga automática en Win < 1903) | Integrado |

---

## 🔐 Seguridad

- Contraseñas hasheadas con **Argon2id**
- Sanitización XSS en inputs
- SQLite con **WAL mode** + **foreign keys**
- Backup atómico vía `VACUUM INTO`
- Auditoría inmutable por ticket
- Sin JWT — sesión local vía plugin-store (app desktop)

---

## 📄 Licencia

MIT License — Ver [LICENSE](https://github.com/GiuDPC/sentinel-core-desktop/blob/main/LICENSE)

---

## 👥 Autores

- [@GiuDPC](https://github.com/GiuDPC)

Proyecto desarrollado en 2026.
