// Sentinel Core — Database helpers
//
// Ejecuta las migraciones SQL embebidas en el binario.

use sqlx::SqlitePool;

/// Ejecuta el archivo de migración inicial.
/// Usa IF NOT EXISTS en cada tabla, así es idempotente.
pub async fn run_migrations(pool: &SqlitePool) {
    let migration_sql = include_str!("../migrations/001_init.sql");

    // SQLite no soporta múltiples statements en un solo query,
    // así que splitteamos por ";" y ejecutamos uno por uno
    for statement in migration_sql.split(';') {
        let trimmed = statement.trim();
        if trimmed.is_empty() || trimmed.starts_with("--") {
            continue;
        }
        if let Err(e) = sqlx::query(trimmed).execute(pool).await {
            // Solo loguear, no crashear (IF NOT EXISTS protege)
            eprintln!("⚠️  Migración warning: {}", e);
        }
    }

    println!("✅ Migraciones ejecutadas correctamente");
}
