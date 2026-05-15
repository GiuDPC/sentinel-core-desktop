use tauri::AppHandle;
use tauri::Manager;
use tauri::State;
use tauri_plugin_notification::NotificationExt;
use sqlx::pool::PoolConnection;
use sqlx::Sqlite;
use sqlx::SqlitePool;
use std::fs;
use serde::Serialize;

use crate::errors::AppError;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupInfo {
    pub filename: String,
    pub size_bytes: u64,
    pub created_at: String,
}

fn send_native_notification(app: &AppHandle, title: &str, body: &str) {
    // Tauri v2 notification — builder is sync, show() returns Result<NotificationHandle>
    #[cfg(desktop)]
    {
        if let Err(e) = app.notification()
            .builder()
            .title(title)
            .body(body)
            .show()
        {
            eprintln!("[Notification error] {}: {}", title, e);
        }
    }
    #[cfg(not(desktop))]
    {
        let _ = title;
        let _ = body;
        eprintln!("[Notification] {}: {}", title, body);
    }
}

#[tauri::command]
pub async fn create_backup(app: AppHandle, db: State<'_, SqlitePool>) -> Result<String, AppError> {
    let app_dir = app.path().app_data_dir().map_err(|e| AppError::Internal(e.to_string()))?;
    let backup_dir = app_dir.join("backups");
    fs::create_dir_all(&backup_dir).map_err(|e| AppError::Internal(e.to_string()))?;
    
    let filename = format!("backup_{}.db", chrono::Utc::now().format("%Y%m%d_%H%M%S"));
    let dest = backup_dir.join(&filename);
    let dest_str = dest.to_string_lossy().to_string();
    
    // VACUUM INTO crea un snapshot 100% consistente del estado actual,
    // incluyendo datos del WAL. Mucho más seguro que fs::copy.
    sqlx::query("VACUUM INTO ?")
        .bind(&dest_str)
        .execute(db.inner())
        .await
        .map_err(|e| AppError::Internal(format!("Error al crear backup: {}", e)))?;

    send_native_notification(&app, "Backup completado", &format!("Backup '{}' creado exitosamente", filename));
    
    Ok(filename)
}

#[tauri::command]
pub async fn list_backups(app: AppHandle) -> Result<Vec<BackupInfo>, AppError> {
    let app_dir = app.path().app_data_dir().map_err(|e| AppError::Internal(e.to_string()))?;
    let backup_dir = app_dir.join("backups");
    
    let mut backups = Vec::new();
    if backup_dir.exists() {
        for entry in fs::read_dir(backup_dir).map_err(|e| AppError::Internal(e.to_string()))? {
            let entry = entry.map_err(|e| AppError::Internal(e.to_string()))?;
            if let Some(name) = entry.file_name().to_str() {
                // Ocultar auto-backups pre_restore de la lista
                if name.starts_with("pre_restore_") { continue; }
                if name.ends_with(".db") {
                    let metadata = entry.metadata().map_err(|e| AppError::Internal(e.to_string()))?;
                    let created_time = metadata.created()
                        .unwrap_or(std::time::SystemTime::UNIX_EPOCH);
                    let datetime: chrono::DateTime<chrono::Utc> = created_time.into();
                    
                    backups.push(BackupInfo {
                        filename: name.to_string(),
                        size_bytes: metadata.len(),
                        created_at: datetime.to_rfc3339(),
                    });
                }
            }
        }
    }
    
    backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(backups)
}

/// Escapa una ruta para usarla dentro de una cadena SQL entre comillas simples.
/// Duplica cualquier comilla simple existente.
fn escape_sql_string(s: &str) -> String {
    s.replace('\'', "''")
}

#[tauri::command]
pub async fn restore_backup(filename: String, app: AppHandle, db: State<'_, SqlitePool>) -> Result<(), AppError> {
    let app_dir = app.path().app_data_dir().map_err(|e| AppError::Internal(e.to_string()))?;
    let backup_path = app_dir.join("backups").join(&filename);
    
    if !backup_path.exists() {
        return Err(AppError::NotFound("Archivo de backup no encontrado".into()));
    }
    
    // ─── SEGURIDAD: crear auto-backup antes de restaurar ───
    let backup_dir = app_dir.join("backups");
    fs::create_dir_all(&backup_dir).map_err(|e| AppError::Internal(e.to_string()))?;
    
    let pre_restore_filename = format!("pre_restore_{}.db", chrono::Utc::now().format("%Y%m%d_%H%M%S"));
    let pre_restore_path = backup_dir.join(&pre_restore_filename);
    let pre_path_str = pre_restore_path.to_string_lossy().to_string();
    
    // VACUUM INTO sobre cualquier conexión — crea un snapshot consistente
    sqlx::query("VACUUM INTO ?")
        .bind(&pre_path_str)
        .execute(db.inner())
        .await
        .map_err(|e| AppError::Internal(format!("Error al crear backup de seguridad: {}", e)))?;
    
    // ─── RESTAURAR — UNA SOLA CONEXIÓN PARA TODO ───
    // CRÍTICO: ATTACH, PRAGMA, DELETE, INSERT y DETACH deben ejecutarse
    // en la MISMA conexión de SQLite. Si usamos el pool, cada execute()
    // puede caer en una conexión distinta y el PRAGMA foreign_keys = OFF
    // no afectaría al DELETE.
    
    let backup_path_str = backup_path.to_string_lossy().to_string();
    let escaped_path = escape_sql_string(&backup_path_str);
    
    // Adquirir una conexión DEDICADA del pool
    let mut conn: PoolConnection<Sqlite> = db.acquire().await
        .map_err(|e| AppError::Internal(format!("Error al conectar a la base de datos: {}", e)))?;
    
    // Helper para limpiar en caso de error: rehabilita FK y DETACH en la misma conexión
    macro_rules! cleanup_and_return {
        ($conn:expr, $err:expr) => {{
            let _ = sqlx::query("PRAGMA foreign_keys = ON").execute(&mut *$conn).await;
            let _ = sqlx::query("DETACH DATABASE backup_db").execute(&mut *$conn).await;
            return Err($err);
        }};
    }
    
    // 1. ATTACH el backup (en la conexión dedicada)
    sqlx::query(&format!("ATTACH DATABASE '{}' AS backup_db", escaped_path))
        .execute(&mut *conn)
        .await
        .map_err(|e| AppError::Internal(format!("Error al abrir backup: {}", e)))?;
    
    // 2. Descubrir tablas (en la MISMA conexión donde está ATTACH)
    let own_tables: Vec<String> = match sqlx::query_scalar(
        "SELECT name FROM main.sqlite_master WHERE type='table' AND name NOT GLOB 'sqlite_*' AND name NOT GLOB '_*'"
    )
        .fetch_all(&mut *conn)
        .await
    {
        Ok(tables) => tables,
        Err(e) => {
            let _ = sqlx::query("DETACH DATABASE backup_db").execute(&mut *conn).await;
            return Err(AppError::Internal(format!("Error al leer schema actual: {}", e)));
        }
    };
    
    let backup_tables: Vec<String> = match sqlx::query_scalar(
        "SELECT name FROM backup_db.sqlite_master WHERE type='table' AND name NOT GLOB 'sqlite_*' AND name NOT GLOB '_*'"
    )
        .fetch_all(&mut *conn)
        .await
    {
        Ok(tables) => tables,
        Err(e) => {
            let _ = sqlx::query("DETACH DATABASE backup_db").execute(&mut *conn).await;
            return Err(AppError::Internal(format!("Error al leer schema del backup: {}", e)));
        }
    };
    
    // Intersección
    let mut common_tables: Vec<&str> = own_tables.iter()
        .filter(|t| backup_tables.contains(t))
        .map(|s| s.as_str())
        .collect();
    
    if common_tables.is_empty() {
        let _ = sqlx::query("DETACH DATABASE backup_db").execute(&mut *conn).await;
        return Err(AppError::Internal(
            "El backup no contiene tablas compatibles con la versión actual del sistema.".into()
        ));
    }
    
    // Orden heurístico de FK: padres primero
    let priority: [&str; 8] = ["categories", "users", "tickets", "assignments", "comments", "notifications", "audit_logs", "roles"];
    common_tables.sort_by_key(|t| priority.iter().position(|p| p == t).unwrap_or(usize::MAX));
    
    // 3. DESHABILITAR FK constraints (en la conexión dedicada)
    if let Err(e) = sqlx::query("PRAGMA foreign_keys = OFF").execute(&mut *conn).await {
        cleanup_and_return!(conn, AppError::Internal(format!("Error al deshabilitar FK: {}", e)));
    }
    
    // 4. BORRAR datos existentes
    for table in &common_tables {
        if let Err(e) = sqlx::query(&format!("DELETE FROM {}", table))
            .execute(&mut *conn)
            .await
        {
            cleanup_and_return!(conn, AppError::Internal(format!("Error al limpiar tabla {}: {}", table, e)));
        }
    }
    
    // 5. Resetear secuencias auto-increment
    for table in &common_tables {
        let _ = sqlx::query(&format!("DELETE FROM sqlite_sequence WHERE name = '{}'", table))
            .execute(&mut *conn)
            .await;
    }
    
    // 6. INSERTAR datos desde el backup
    for table in &common_tables {
        if let Err(e) = sqlx::query(&format!("INSERT INTO {} SELECT * FROM backup_db.{}", table, table))
            .execute(&mut *conn)
            .await
        {
            cleanup_and_return!(conn, AppError::Internal(format!("Error al restaurar tabla {}: {}", table, e)));
        }
    }
    
    // 7. Reajustar secuencias sqlite_sequence
    for table in &common_tables {
        let _ = sqlx::query(&format!(
            "UPDATE sqlite_sequence SET seq = (SELECT COALESCE(MAX(id), 0) FROM {}) WHERE name = '{}'",
            table, table
        ))
        .execute(&mut *conn)
        .await;
    }
    
    // 8. REHABILITAR FK constraints
    if let Err(e) = sqlx::query("PRAGMA foreign_keys = ON").execute(&mut *conn).await {
        cleanup_and_return!(conn, AppError::Internal(format!("Error al habilitar FK: {}", e)));
    }
    
    // 9. DETACH backup
    if let Err(e) = sqlx::query("DETACH DATABASE backup_db").execute(&mut *conn).await {
        return Err(AppError::Internal(format!("Error al desconectar backup: {}", e)));
    }
    
    // conn se dropea aquí → vuelve al pool automáticamente
    
    send_native_notification(
        &app,
        "Restauración completada",
        &format!("Base de datos restaurada desde '{}'. Backup previo guardado como '{}'", filename, pre_restore_filename),
    );
    
    Ok(())
}

#[tauri::command]
pub async fn delete_backup(filename: String, app: AppHandle) -> Result<(), AppError> {
    let app_dir = app.path().app_data_dir().map_err(|e| AppError::Internal(e.to_string()))?;
    let backup_path = app_dir.join("backups").join(&filename);
    
    if backup_path.exists() {
        fs::remove_file(backup_path).map_err(|e| AppError::Internal(e.to_string()))?;
    }
    
    send_native_notification(&app, "Backup eliminado", &format!("Backup '{}' eliminado", filename));
    
    Ok(())
}

#[tauri::command]
pub async fn export_backup(filename: String, app: AppHandle) -> Result<String, AppError> {
    let app_dir = app.path().app_data_dir().map_err(|e| AppError::Internal(e.to_string()))?;
    let backup_path = app_dir.join("backups").join(&filename);
    
    if !backup_path.exists() {
        return Err(AppError::NotFound("Archivo de backup no encontrado".into()));
    }
    
    let dirs = directories::UserDirs::new().ok_or_else(|| AppError::Internal("No se pudieron obtener los directorios del usuario".into()))?;
    let downloads = dirs.download_dir().ok_or_else(|| AppError::Internal("No se encontró la carpeta de descargas".into()))?;
    
    let dest_path = downloads.join(&filename);
    fs::copy(&backup_path, &dest_path).map_err(|e| AppError::Internal(e.to_string()))?;

    send_native_notification(&app, "Backup exportado", &format!("Backup exportado a: {}", dest_path.display()));
    
    Ok(dest_path.to_string_lossy().to_string())
}
