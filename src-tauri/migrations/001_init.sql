-- =====================================================
-- Sentinel Core — Migración Inicial SQLite
-- Traducción directa del schema.prisma original
-- =====================================================

-- Roles del sistema (ADMIN, TECHNICIAN, REQUESTER)
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Usuarios (admins, técnicos, locatarios)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT,
  department TEXT,
  store_number TEXT,
  store_name TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Categorías de tickets (con SLA en horas)
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL DEFAULT 'OTROS',
  sla_hours INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tickets (entidad central del sistema)
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  ticket_code TEXT NOT NULL UNIQUE,
  creator_id TEXT NOT NULL REFERENCES users(id),
  category_id INTEGER NOT NULL REFERENCES categories(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','ASSIGNED','IN_PROGRESS','ON_HOLD','RESOLVED','AWAITING_CONFIRMATION','CLOSED')),
  priority TEXT NOT NULL CHECK(priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  due_date TEXT,
  resolution_note TEXT,
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_creator ON tickets(creator_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status_due ON tickets(status, due_date);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at);

-- Asignaciones (tabla pivote M:N entre tickets y técnicos)
CREATE TABLE IF NOT EXISTS assignments (
  ticket_id TEXT NOT NULL REFERENCES tickets(id),
  technician_id TEXT NOT NULL REFERENCES users(id),
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (ticket_id, technician_id)
);

-- Comentarios (públicos e internos)
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES tickets(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_internal INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Notificaciones por usuario
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('TICKET_STATUS','COMMENT','ASSIGNMENT','SYSTEM')),
  link TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notif_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notif_user_created ON notifications(user_id, created_at);

-- Auditoría inmutable (trazabilidad forense)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES tickets(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_ticket ON audit_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
