Fase 0 y A

{
"content": "**What**: Eliminado backend/ completo y creada la infraestructura Tauri v2 desde cero.\n**Why**: Migración de Node.js/Express/Prisma/PostgreSQL a Tauri nativo con Rust + SQLite.\n**Where**: src-tauri/ (Cargo.toml, tauri.conf.json, capabilities/default.json, migrations/001_init.sql, src/lib.rs, src/main.rs, src/db.rs, src/seed.rs, src/models.rs, src/errors.rs, src/state_machine.rs, src/sla.rs, src/commands/\*.rs)\n**Learned**: 4 reglas inquebrantables aplicadas: (1) CERO tauri-plugin-sql en frontend — Zero Trust, (2) sqlx async en vez de rusqlite, (3) ciclo de vida setup() con pool+migrate+seed ANTES de la ventana, (4) libwebkit2gtk-4.1-dev en CI. SQLite no soporta multi-statement en un solo query — hay que splittear por ';'. Argon2 es CPU-bound y debe ir en spawn_blocking.",
"project": "sentinel-core",
"title": "Fase 0 y A completadas: Tauri infra creada",
"topic_key": "architecture/tauri-migration",
"type": "architecture"
}

FASE B COMPLETA

{
"content": "**What**: Implementada la Fase B COMPLETA de la migración a Tauri (Lógica de Negocio en Rust).\n**Why**: Es necesario tener un backend nativo robusto, asíncrono y tipeado para reemplazar Express/Prisma, siguiendo el principio Zero Trust donde React solo invoca comandos y no toca la DB.\n**Where**: \n- `src-tauri/src/state_machine.rs`, `src-tauri/src/sla.rs` (Helpers)\n- `src-tauri/src/commands/mod.rs` (Registro de módulos)\n- `src-tauri/src/commands/auth.rs` (Login, Register, Password con Argon2 en spawn_blocking)\n- `src-tauri/src/commands/tickets.rs` (CRUD, validación SLA y State Machine)\n- `src-tauri/src/commands/assignments.rs` (Algoritmo de asignación y Workload)\n- `src-tauri/src/commands/categories.rs`, `users.rs`, `comments.rs`, `notifications.rs`, `metrics.rs`, `audit.rs` (CRUDS mapeados 1 a 1 desde Node.js)\n- `src-tauri/src/commands/backups.rs` (Copia y listado de archivo `.db` en app_data_dir)\n- `src-tauri/src/lib.rs` (Registro masivo de todos los handlers y setup del lifecycle)\n**Learned**: \n1. Los comandos de Tauri requieren que los parámetros inyectados (State) y los tipos de retorno implementen Serialize/Deserialize.\n2. El uso estricto de `AppError` garantiza que el frontend atrape los errores como JSON strings limpios en lugar de pánicos del compilador.\n3. El cálculo asíncrono de CPU-bound (hashing de contraseñas) debe ir sí o sí en `tokio::task::spawn_blocking` dentro de los comandos `login`, `register` y `change_password` para no asfixiar el scheduler de Tauri.",
"project": "sentinel-core",
"scope": "project",
"title": "Fase B completada: Migración completa de servicios a comandos Rust",
"topic_key": "architecture/tauri-migration-fase-b-full",
"type": "architecture"
}

FASE C.1

{
"content": "**What**: Implementada la Fase C.1 de la migración a Tauri (Recableado Core del Frontend).\n**Why**: Para abandonar completamente las llamadas HTTP asíncronas y migrar el flujo base de enrutamiento y autenticación hacia el protocolo nativo IPC de Tauri, asegurando la compatibilidad con el entorno desktop 100% offline.\n**Where**: \n- `frontend/src/api/client.js` (Nuevo wrapper IPC con captura genérica de AppError)\n- `frontend/src/routes/router.jsx` (Migración a HashRouter en lugar de BrowserRouter)\n- `frontend/src/api/auth.js` (Adaptación a invoke() mapeando a los comandos Rust de auth)\n- `frontend/src/Contexts/AuthContext.jsx` (Reemplazo de cookies httpOnly por @tauri-apps/plugin-store persistiendo sesión en `session.dat`)\n**Learned**: \n1. Los errores lanzados desde Tauri se serializan a JS como un String o un object. Nuestro wrapper en `client.js` procesa esto tirando un `throw new Error(errorMsg)` nativo para que los `try/catch` de los componentes React no se enteren del cambio en la capa de transporte.\n2. `BrowserRouter` no funciona correctamente en compilaciones de producción de Tauri porque carga los assets desde URLs relativas asumiendo un servidor web. El `HashRouter` es obligatorio.\n3. La sesión ahora se maneja de manera puramente client-side guardando el estado en `session.dat`. En el arranque (`checkAuth`), leemos ese file y volvemos a invocar `get_profile` pasándole el ID que sacamos del file para mantener la re-validación segura.",
"project": "sentinel-core",
"scope": "project",
"title": "Fase C.1 completada: Recableado Core IPC Frontend",
"topic_key": "architecture/tauri-migration-fase-c1",
"type": "architecture"
}

FASE C.2

{
"content": "**What**: Implementada la Fase C.2 de la migración a Tauri (Refactorización de Servicios de Negocio en el Frontend).\n**Why**: Se debía culminar la eliminación de peticiones HTTP en el frontend, mapeando cada servicio REST viejo a su correspondiente comando IPC nativo de Rust. Esto asegura la arquitectura Zero Trust, la reducción de latencia al evitar la red loopback y el soporte offline absoluto.\n**Where**: \n- `src/api/tickets.js` (CRUD de tickets)\n- `src/api/assignments.js` (Lógica Least Connections movida a IPC)\n- `src/api/categories.js` (CRUD categorías)\n- `src/api/users.js` (Gestión de usuarios y perfiles)\n- `src/api/comments.js` (Comentarios de tickets)\n- `src/api/notifications.js` (Notificaciones in-app)\n- `src/api/metrics.js` (Métricas de dashboard)\n- `src/api/audit.js` (Logs de auditoría)\n- `src/api/backups.js` (Gestión de backups locales)\n**Learned**: \n1. Mantuve deliberadamente las firmas originales de las funciones exportadas en cada archivo (como `assignTechnician` en `ticketsApi`) incluso cuando extraje la lógica hacia `assignmentsApi`, garantizando que ningún componente de React crashee por culpa de una refactorización prematura de módulos.\n2. Todas las funciones ahora usan `return await api.invoke(...)` apuntando explícitamente a los comandos registrados en `commands/mod.rs`.\n3. Eliminados todos los imports de `fetch` y rastros de URIs o variables de entorno `API_URL`. Tauri no requiere host ni ports para comunicarse con su propio backend nativo.",
"project": "sentinel-core",
"scope": "project",
"title": "Fase C.2 completada: Servicios Frontend Migrados a IPC",
"topic_key": "architecture/tauri-migration-fase-c2",
"type": "architecture"
}

ULTIMAS FASE DE C las c.3 c.4 y c.5

{
"content": "**What**: Validación y cierre definitivo de la Fase C completa (Migración del Frontend a Tauri IPC).\n**Why**: Para asegurar que la infraestructura del frontend no solo está refactorizada (C1 y C2), sino validada contra la documentación oficial de Tauri v2 (Context7), evitando errores de sintaxis o runtime (como top-level awaits ilegales o fallas de ruteo).\n**Where**: \n- `frontend/src/Contexts/AuthContext.jsx` (Refactorizado con lazy loading `load()` de `@tauri-apps/plugin-store` en lugar del constructor `new Store` que estaba deprecado/incorrecto para v2).\n- `frontend/src/routes/router.jsx` (Confirmado el uso de `HashRouter` para SPA locales).\n- Capa de presentación (C5) intocada para no romper la UI.\n**Learned**: \n1. En Tauri v2, el plugin-store no se inicializa con `new Store('file')` de manera síncrona en top-level porque crashea si el bundler no soporta top-level await. La forma correcta y segura es usar `async function getSessionStore() { return await load('session.dat'); }` dentro del flujo de React.\n2. Todo el ecosistema de la app ahora es estrictamente IPC + Local Storage, lo que nos da la confirmación total de arquitectura offline sin dependencias de red loopback.",
"project": "sentinel-core",
"scope": "project",
"title": "Fase C finalizada: Validación estricta Tauri v2 Plugin Store",
"topic_key": "architecture/tauri-migration-fase-c3-c4",
"type": "architecture"
}
