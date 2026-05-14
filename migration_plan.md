# 🏗️ Plan de Re-Arquitectura: Sentinel Core → Tauri Nativo

> [!IMPORTANT]
> **4 Reglas Inquebrantables de Seguridad (Zero Trust)**
> 1. **CERO `tauri-plugin-sql` en frontend** — React NUNCA toca la DB directamente. Todo pasa por comandos Rust.
> 2. **`sqlx` async en vez de `rusqlite`** — No bloquear el hilo principal de Tauri con I/O síncrono.
> 3. **Ciclo de vida `setup()`** — DB, migraciones y seed DEBEN estar listos ANTES de que la ventana se abra.
> 4. **`libwebkit2gtk-4.1-dev`** — Versión 4.1 obligatoria para Tauri v2 en Linux CI.

## Objetivo
Migrar Sentinel Core de Node.js/Express/Prisma/PostgreSQL a **Tauri v2 + Rust + SQLite + React 19**, eliminando toda dependencia inestable y usando IPC nativo en lugar de HTTP local.

---

## Fase 0: Limpieza del Repositorio

### Archivos/Carpetas a ELIMINAR
```bash
# Backend completo (se reemplaza por Rust)
rm -rf backend/

# Archivos de config heredados
rm -f frontend/.env
rm -f frontend/vite.config.js  # se regenera para Tauri
```

### Dependencias Frontend a REMOVER
```bash
cd frontend
npm uninstall sweetalert2  # reemplazado por tauri-plugin-notification para alertas OS
```

### Dependencias Frontend que SE MANTIENEN
| Paquete | Versión | Razón |
|---------|---------|-------|
| react | 19.2.4 | Core UI |
| react-dom | 19.2.4 | Renderizado |
| react-router-dom | 7.14.1 | Enrutamiento SPA |
| zustand | 5.0.12 | Estado global |
| framer-motion | 12.38.0 | Animaciones |
| recharts | 3.8.1 | Gráficos KPI |
| lucide-react | 1.14.0 | Iconos |
| sonner | 2.0.7 | Toast UI (complementa notificaciones nativas) |
| xlsx | 0.18.5 | Export Excel en frontend |
| zod | 3.24+ | Validación frontend (NUEVA — antes solo backend) |

### Dependencias Frontend NUEVAS
```bash
# ⚠️ SIN plugin-sql — Zero Trust: React NO toca la DB
npm install @tauri-apps/api @tauri-apps/plugin-store @tauri-apps/plugin-notification @tauri-apps/plugin-dialog zod
```

---

## Fase A: Infraestructura Tauri

### A1. Inicializar Tauri v2
```bash
cd frontend
npm install @tauri-apps/cli
npx tauri init
```

### A2. Estructura de Carpetas Final
```
sentinel-core-desktop/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── capabilities/
│   │   └── default.json          # Permisos IPC
│   ├── migrations/
│   │   └── 001_init.sql          # Schema SQLite
│   ├── src/
│   │   ├── main.rs               # Entry point + plugin registration
│   │   ├── lib.rs                # Tauri builder
│   │   ├── db.rs                 # Pool SQLite + helpers
│   │   ├── seed.rs               # Auto-seeding al primer inicio
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── auth.rs           # login, register, get_profile, change_password
│   │   │   ├── tickets.rs        # CRUD + auto_assign + resolve + confirm
│   │   │   ├── assignments.rs    # assign, reassign, workload
│   │   │   ├── categories.rs     # CRUD categorías
│   │   │   ├── users.rs          # CRUD usuarios
│   │   │   ├── comments.rs       # crear, listar por ticket
│   │   │   ├── notifications.rs  # CRUD + mark_read + notify_admins
│   │   │   ├── metrics.rs        # dashboard, requester_metrics, tech_metrics
│   │   │   ├── audit.rs          # log_action, find_by_ticket, find_all
│   │   │   └── backups.rs        # copy .db file, restore, list
│   │   ├── models.rs             # Structs serializables (serde)
│   │   ├── state_machine.rs      # Transiciones válidas de ticket
│   │   ├── sla.rs                # Cálculo de due_date
│   │   └── errors.rs             # AppError -> Result<T, String>
│   └── icons/
├── src/                          # React (se mantiene casi intacto)
│   ├── api/
│   │   ├── client.js             # REESCRITO: usa invoke() en vez de fetch
│   │   ├── auth.js               # Adaptado a invoke
│   │   ├── tickets.js            # Adaptado a invoke
│   │   └── ...                   # Todos adaptados
│   ├── components/               # Sin cambios (Tailwind + Framer Motion)
│   ├── Contexts/AuthContext.jsx  # Adaptado: usa plugin-store en vez de cookies
│   ├── pages/                    # Sin cambios estructurales
│   ├── routes/router.jsx         # BrowserRouter → HashRouter (Tauri req)
│   └── store/                    # Sin cambios
├── index.html
├── package.json
├── vite.config.js                # Regenerado para Tauri
└── tailwind.config.js
```

### A3. Cargo.toml (Dependencias Rust)
```toml
[dependencies]
tauri = { version = "2", features = [] }
# ⚠️ SIN tauri-plugin-sql — la DB se maneja SOLO desde Rust
tauri-plugin-store = "2"
tauri-plugin-notification = "2"
tauri-plugin-dialog = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
argon2 = "0.5"                    # Hashing passwords (crate nativo Rust)
uuid = { version = "1", features = ["v4"] }
chrono = { version = "0.4", features = ["serde"] }
# ⚠️ sqlx ASYNC en vez de rusqlite síncrono — no bloquea el hilo de UI
sqlx = { version = "0.8", features = ["sqlite", "runtime-tokio-rustls", "chrono"] }
tokio = { version = "1", features = ["full"] }
rand = "0.8"
```

### A4. tauri.conf.json (Configuración Core)
```json
{
  "productName": "Sentinel Core",
  "version": "1.0.0",
  "identifier": "com.sentinel.core",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:5173",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "withGlobalTauri": false,
    "windows": [{ "title": "Sentinel Core", "width": 1280, "height": 800, "resizable": true }]
  },
  "bundle": {
    "active": true,
    "targets": ["msi", "nsis", "deb", "appimage"],
    "icon": ["icons/icon.png"],
    "windows": { "webviewInstallMode": { "type": "downloadBootstrapper" } }
  }
}
```
> [!CAUTION]
> **SIN bloque `plugins.sql`** — La DB se inicializa en el hook `setup()` de Rust, NO desde el config.

### A5. Capabilities/Permisos (`capabilities/default.json`)
```json
{
  "identifier": "default",
  "description": "Default capabilities for Sentinel Core",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "store:default",
    "notification:default",
    "notification:allow-notify",
    "dialog:default",
    "dialog:allow-save"
  ]
}
```
> [!NOTE]
> **CERO permisos sql** — El frontend no tiene acceso a ningún driver de DB. Solo habla con Rust via `invoke()`.

### A6. Migración SQLite (`migrations/001_init.sql`)
Traducción directa del schema.prisma a DDL de SQLite:
```sql
-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,  -- UUID
  role_id INTEGER NOT NULL REFERENCES roles(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT,
  department TEXT,  -- ENUM como TEXT en SQLite
  store_number TEXT,
  store_name TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL DEFAULT 'OTROS',
  sla_hours INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  ticket_code TEXT NOT NULL UNIQUE,
  creator_id TEXT NOT NULL REFERENCES users(id),
  category_id INTEGER NOT NULL REFERENCES categories(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  priority TEXT NOT NULL,
  due_date TEXT,
  resolution_note TEXT,
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_creator ON tickets(creator_id);
CREATE INDEX idx_tickets_status_due ON tickets(status, due_date);

-- Assignments (tabla pivote)
CREATE TABLE IF NOT EXISTS assignments (
  ticket_id TEXT NOT NULL REFERENCES tickets(id),
  technician_id TEXT NOT NULL REFERENCES users(id),
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (ticket_id, technician_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES tickets(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_internal INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  link TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_notif_user_read ON notifications(user_id, is_read);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES tickets(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_audit_ticket ON audit_logs(ticket_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

---

## Fase B: Lógica de Negocio en Rust

### B1. Mapeo Servicio Node.js → Comando Rust

| Servicio Node.js | Comando Rust | Archivo |
|-----------------|-------------|---------|
| `authService.login` | `login` | `commands/auth.rs` |
| `authService.register` | `register_user` | `commands/auth.rs` |
| `authService.registerPublic` | `register_public` | `commands/auth.rs` |
| `authService.getProfile` | `get_profile` | `commands/auth.rs` |
| `authService.changePassword` | `change_password` | `commands/auth.rs` |
| `ticketService.create` | `create_ticket` | `commands/tickets.rs` |
| `ticketService.findAll` | `get_tickets` | `commands/tickets.rs` |
| `ticketService.findById` | `get_ticket` | `commands/tickets.rs` |
| `ticketService.updateStatus` | `update_ticket_status` | `commands/tickets.rs` |
| `ticketService.resolveWithNote` | `resolve_ticket` | `commands/tickets.rs` |
| `ticketService.confirmTicket` | `confirm_ticket` | `commands/tickets.rs` |
| `ticketService.findByCreator` | `get_my_tickets` | `commands/tickets.rs` |
| `ticketService.findAssigned` | `get_assigned_tickets` | `commands/tickets.rs` |
| `assignmentService.assignTechnician` | `assign_technician` | `commands/assignments.rs` |
| `assignmentService.reassignTechnician` | `reassign_technician` | `commands/assignments.rs` |
| `assignmentService.getTechniciansByWorkload` | `get_workload` | `commands/assignments.rs` |
| `categoryService.*` | `get/create/update/delete_category` | `commands/categories.rs` |
| `userService.*` | `get/update/deactivate_user` | `commands/users.rs` |
| `commentService.*` | `create/get_comments` | `commands/comments.rs` |
| `notificationService.*` | `get/mark/mark_all_notifications` | `commands/notifications.rs` |
| `metricsService.*` | `get_dashboard/requester/tech_metrics` | `commands/metrics.rs` |
| `auditService.*` | `get_audit_logs/by_ticket` | `commands/audit.rs` |
| `backupService.*` | `create/restore/list/delete_backup` | `commands/backups.rs` |

### B2. State Machine (Rust)
Traducción directa de `state-machine.ts`:
```rust
// src-tauri/src/state_machine.rs
use std::collections::HashMap;

pub fn valid_transitions() -> HashMap<&'static str, Vec<&'static str>> {
    HashMap::from([
        ("OPEN", vec!["ASSIGNED"]),
        ("ASSIGNED", vec!["IN_PROGRESS"]),
        ("IN_PROGRESS", vec!["ON_HOLD", "RESOLVED"]),
        ("ON_HOLD", vec!["IN_PROGRESS"]),
        ("RESOLVED", vec!["AWAITING_CONFIRMATION"]),
        ("AWAITING_CONFIRMATION", vec!["CLOSED", "IN_PROGRESS"]),
        ("CLOSED", vec![]),
    ])
}

pub fn is_valid_transition(current: &str, next: &str) -> bool {
    valid_transitions()
        .get(current)
        .map_or(false, |allowed| allowed.contains(&next))
}
```

### B3. SLA Calculator (Rust)
```rust
// src-tauri/src/sla.rs
use chrono::{NaiveDateTime, Duration};

pub fn calculate_due_date(created_at: NaiveDateTime, sla_hours: i64) -> NaiveDateTime {
    created_at + Duration::hours(sla_hours)
}

pub fn is_sla_breached(due_date: Option<NaiveDateTime>) -> bool {
    due_date.map_or(false, |d| chrono::Utc::now().naive_utc() > d)
}
```

### B4. Auto-Asignación (Least Connections) en SQL puro
```sql
-- Obtener técnico con menos tickets activos del departamento
SELECT u.id, COUNT(a.ticket_id) as active_count
FROM users u
LEFT JOIN assignments a ON u.id = a.technician_id
  AND a.ticket_id IN (
    SELECT id FROM tickets WHERE status NOT IN ('RESOLVED', 'CLOSED')
  )
WHERE u.role_id = (SELECT id FROM roles WHERE name = 'TECHNICIAN')
  AND u.is_active = 1
  AND u.department = ?1
GROUP BY u.id
ORDER BY active_count ASC
LIMIT 1;
```

### B5. Autenticación (Sin JWT — Sesión Local con sqlx async)
En Tauri desktop **no hay necesidad de JWT ni cookies**. La sesión se persiste con `tauri-plugin-store`:
```rust
// Login: verificar argon2 async, guardar sesión en store
#[tauri::command]
async fn login(
    email: String,
    password: String,
    db: tauri::State<'_, sqlx::SqlitePool>,  // ← Pool async inyectado
) -> Result<UserResponse, String> {
    let user = sqlx::query_as::<_, UserRow>(
        "SELECT * FROM users WHERE email = ?1 AND is_active = 1"
    )
    .bind(&email)
    .fetch_optional(db.inner())
    .await
    .map_err(|e| e.to_string())?
    .ok_or("Credenciales inválidas")?;

    // Argon2 verify (CPU-bound, se delega a blocking thread)
    let hash = user.password_hash.clone();
    let pwd = password.clone();
    let valid = tokio::task::spawn_blocking(move || {
        argon2::verify_encoded(&hash, pwd.as_bytes()).unwrap_or(false)
    }).await.map_err(|e| e.to_string())?;

    if !valid {
        return Err("Credenciales inválidas".into());
    }
    Ok(user.into())
}
```

### B5b. Ciclo de Vida Crítico: `setup()` en `lib.rs`
Toda la inicialización ocurre **ANTES** de que la ventana se abra:
```rust
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_dir)?;
            let db_path = app_dir.join("sentinel_core.db");
            let db_url = format!("sqlite:{}?mode=rwc", db_path.display());

            // Pool async — se inicializa ANTES de la ventana
            let pool = tauri::async_runtime::block_on(async {
                let pool = SqlitePoolOptions::new()
                    .max_connections(5)
                    .connect(&db_url)
                    .await
                    .expect("Failed to create DB pool");

                // Migraciones (crear tablas)
                sqlx::query(include_str!("../migrations/001_init.sql"))
                    .execute(&pool)
                    .await
                    .expect("Failed to run migrations");

                // Seed si la DB está vacía
                crate::seed::run_if_empty(&pool).await;

                pool
            });

            // Inyectar al estado global de Tauri
            app.manage(pool);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Todos los comandos registrados aquí
        ])
        .run(tauri::generate_context!())
        .expect("error while running Sentinel Core");
}
```
> [!IMPORTANT]
> **Orden garantizado**: `create_dir` → `connect pool` → `migrate` → `seed` → `app.manage(pool)` → ventana se abre. React NUNCA verá tablas vacías.

### B6. Backups (Copia de archivo SQLite)
```rust
#[tauri::command]
async fn create_backup(app: AppHandle) -> Result<String, String> {
    let db_path = app.path().app_data_dir()?.join("sentinel_core.db");
    let backup_dir = app.path().app_data_dir()?.join("backups");
    fs::create_dir_all(&backup_dir)?;
    let filename = format!("backup_{}.db", chrono::Utc::now().format("%Y%m%d_%H%M%S"));
    let dest = backup_dir.join(&filename);
    fs::copy(&db_path, &dest)?;
    Ok(filename)
}
```

---

## Fase C: Migración del Frontend

### C1. Nuevo `api/client.js` (Reemplazo de fetch por invoke)
```javascript
import { invoke } from '@tauri-apps/api/core';

export const api = {
  invoke: async (command, args = {}) => {
    try {
      return await invoke(command, args);
    } catch (error) {
      throw new Error(typeof error === 'string' ? error : error.message || 'Error desconocido');
    }
  }
};
```

### C2. Nuevo `api/auth.js`
```javascript
import { api } from './client';

export const authApi = {
  login: ({ email, password }) => api.invoke('login', { email, password }),
  register: (data) => api.invoke('register_public', data),
  logout: () => api.invoke('logout'),
  getCurrentUser: () => api.invoke('get_profile'),
  changePassword: (data) => api.invoke('change_password', data),
};
```

### C3. AuthContext Adaptado
Cambio principal: `checkAuth` usa `plugin-store` para leer la sesión persistida en disco en vez de enviar una cookie HTTP.

### C4. Router: `BrowserRouter` → `HashRouter`
Tauri sirve archivos estáticos, necesita hash routing:
```jsx
import { HashRouter } from 'react-router-dom';
// Reemplazar <BrowserRouter> por <HashRouter> en router.jsx
```

### C5. Componentes que NO cambian
Toda la capa de presentación (Tailwind, Framer Motion, Recharts, Lucide) se mantiene intacta. Solo cambian las llamadas a la API.

---

## Fase D: Seeding Automático (Primer Inicio)

En `seed.rs`, al detectar tablas vacías, insertar los mismos datos del seed de Prisma:
- 3 Roles (ADMIN, TECHNICIAN, REQUESTER)
- 8 Categorías con SLA
- 2 Admins, 5 Técnicos, 8 Locatarios
- 35 Tickets en distintos estados
- Audit logs y comentarios asociados

Credenciales idénticas:
- Admin: `admin@sentinel.local` / `SentinelAdmin2026!`
- Técnico: `carlos.perez@sentinel.local` / `Tecnico2026!`
- Locatario: `ana.martinez@sentinel.local` / `Locatario2026!`

---

## Fase E: CI/CD con GitHub Actions

### `build.yml`
```yaml
name: Build Sentinel Core
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: ubuntu-latest
            args: ''
          - platform: windows-latest
            args: ''

    runs-on: ${{ matrix.platform }}

    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install Linux deps
        if: matrix.platform == 'ubuntu-latest'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install frontend deps
        run: npm ci

      - name: Build Tauri
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: v__VERSION__
          releaseName: 'Sentinel Core v__VERSION__'
          releaseBody: 'Desktop release'
          releaseDraft: true
          prerelease: false
          args: ${{ matrix.args }}
```

**Artefactos generados:**
- **Windows**: `.msi` + `.exe` (NSIS) con WebView2 bootstrapper
- **Linux**: `.deb` + `.AppImage`

---

## Checklist de Ejecución

| # | Tarea | Estado |
|---|-------|--------|
| 1 | Eliminar carpeta `backend/` completa | ⬜ |
| 2 | `npx tauri init` en frontend | ⬜ |
| 3 | Configurar `Cargo.toml` con dependencias | ⬜ |
| 4 | Escribir `001_init.sql` (migración SQLite) | ⬜ |
| 5 | Implementar `lib.rs` + `main.rs` con plugins | ⬜ |
| 6 | Implementar `commands/auth.rs` (login/register/profile) | ⬜ |
| 7 | Implementar `commands/tickets.rs` (CRUD + auto-assign) | ⬜ |
| 8 | Implementar `commands/assignments.rs` (assign/reassign) | ⬜ |
| 9 | Implementar `commands/categories.rs` | ⬜ |
| 10 | Implementar `commands/users.rs` | ⬜ |
| 11 | Implementar `commands/comments.rs` | ⬜ |
| 12 | Implementar `commands/notifications.rs` | ⬜ |
| 13 | Implementar `commands/metrics.rs` | ⬜ |
| 14 | Implementar `commands/audit.rs` | ⬜ |
| 15 | Implementar `commands/backups.rs` (copia .db) | ⬜ |
| 16 | Implementar `seed.rs` (auto-seed al primer inicio) | ⬜ |
| 17 | Reescribir `api/client.js` → invoke wrapper | ⬜ |
| 18 | Adaptar todos los `api/*.js` a invoke | ⬜ |
| 19 | Adaptar `AuthContext.jsx` → plugin-store | ⬜ |
| 20 | Cambiar `BrowserRouter` → `HashRouter` | ⬜ |
| 21 | Configurar `capabilities/default.json` | ⬜ |
| 22 | Configurar `tauri.conf.json` (bundle + plugins) | ⬜ |
| 23 | Crear `.github/workflows/build.yml` | ⬜ |
| 24 | Test compilación Windows | ⬜ |
| 25 | Test compilación Linux | ⬜ |
