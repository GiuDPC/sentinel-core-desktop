use tauri::AppHandle;
use tauri::Manager;
use tauri_plugin_notification::NotificationExt;
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
pub async fn create_backup(app: AppHandle) -> Result<String, AppError> {
    let app_dir = app.path().app_data_dir().map_err(|e| AppError::Internal(e.to_string()))?;
    let db_path = app_dir.join("sentinel_core.db");
    let backup_dir = app_dir.join("backups");
    
    fs::create_dir_all(&backup_dir).map_err(|e| AppError::Internal(e.to_string()))?;
    
    let filename = format!("backup_{}.db", chrono::Utc::now().format("%Y%m%d_%H%M%S"));
    let dest = backup_dir.join(&filename);
    
    fs::copy(&db_path, &dest).map_err(|e| AppError::Internal(e.to_string()))?;

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

#[tauri::command]
pub async fn restore_backup(filename: String, app: AppHandle) -> Result<(), AppError> {
    let app_dir = app.path().app_data_dir().map_err(|e| AppError::Internal(e.to_string()))?;
    let db_path = app_dir.join("sentinel_core.db");
    let backup_path = app_dir.join("backups").join(&filename);
    
    if !backup_path.exists() {
        return Err(AppError::NotFound("Archivo de backup no encontrado".into()));
    }
    
    // ─── SEGURIDAD: crear auto-backup antes de restaurar ───
    let backup_dir = app_dir.join("backups");
    fs::create_dir_all(&backup_dir).map_err(|e| AppError::Internal(e.to_string()))?;
    
    let pre_restore_filename = format!("pre_restore_{}.db", chrono::Utc::now().format("%Y%m%d_%H%M%S"));
    let pre_restore_path = backup_dir.join(&pre_restore_filename);
    
    if db_path.exists() {
        fs::copy(&db_path, &pre_restore_path).map_err(|e| AppError::Internal(e.to_string()))?;
    }
    
    // Ahora restaurar
    fs::copy(&backup_path, &db_path).map_err(|e| AppError::Internal(e.to_string()))?;

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
