use tauri::AppHandle;
use tauri::Manager;
use std::fs;

use crate::errors::AppError;

#[tauri::command]
pub async fn create_backup(app: AppHandle) -> Result<String, AppError> {
    let app_dir = app.path().app_data_dir().map_err(|e| AppError::Internal(e.to_string()))?;
    let db_path = app_dir.join("sentinel_core.db");
    let backup_dir = app_dir.join("backups");
    
    fs::create_dir_all(&backup_dir).map_err(|e| AppError::Internal(e.to_string()))?;
    
    let filename = format!("backup_{}.db", chrono::Utc::now().format("%Y%m%d_%H%M%S"));
    let dest = backup_dir.join(&filename);
    
    fs::copy(&db_path, &dest).map_err(|e| AppError::Internal(e.to_string()))?;
    
    Ok(filename)
}

use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupInfo {
    pub filename: String,
    pub size_bytes: u64,
    pub created_at: String,
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
    
    // Ordenar de más reciente a más antiguo
    backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(backups)
}

#[tauri::command]
pub async fn restore_backup(filename: String, app: AppHandle) -> Result<(), AppError> {
    let app_dir = app.path().app_data_dir().map_err(|e| AppError::Internal(e.to_string()))?;
    let db_path = app_dir.join("sentinel_core.db");
    let backup_path = app_dir.join("backups").join(filename);
    
    if !backup_path.exists() {
        return Err(AppError::NotFound("Archivo de backup no encontrado".into()));
    }
    
    // Para hacer restore de SQLite en uso, lo ideal es cerrar conexiones, 
    // pero como mínimo copiamos y sobrescribimos.
    // NOTA: Para producción real es recomendable usar vacuum o restore de SQLite online.
    fs::copy(&backup_path, &db_path).map_err(|e| AppError::Internal(e.to_string()))?;
    
    Ok(())
}

#[tauri::command]
pub async fn delete_backup(filename: String, app: AppHandle) -> Result<(), AppError> {
    let app_dir = app.path().app_data_dir().map_err(|e| AppError::Internal(e.to_string()))?;
    let backup_path = app_dir.join("backups").join(&filename);
    
    if backup_path.exists() {
        fs::remove_file(backup_path).map_err(|e| AppError::Internal(e.to_string()))?;
    }
    
    Ok(())
}

#[tauri::command]
pub async fn export_backup(filename: String, app: AppHandle) -> Result<String, AppError> {
    let app_dir = app.path().app_data_dir().map_err(|e| AppError::Internal(e.to_string()))?;
    let backup_path = app_dir.join("backups").join(&filename);
    
    if !backup_path.exists() {
        return Err(AppError::NotFound("Archivo de backup no encontrado".into()));
    }
    
    // Tauri v2 save dialog
    // As a workaround since dialog requires user interaction, we export to Downloads directly
    // Or we just return the full path so the frontend can handle it if needed.
    // But since it's desktop, let's copy it to Downloads folder.
    let dirs = directories::UserDirs::new().ok_or_else(|| AppError::Internal("No user dirs".into()))?;
    let downloads = dirs.download_dir().ok_or_else(|| AppError::Internal("No downloads dir".into()))?;
    
    let dest_path = downloads.join(&filename);
    fs::copy(&backup_path, &dest_path).map_err(|e| AppError::Internal(e.to_string()))?;
    
    Ok(dest_path.to_string_lossy().to_string())
}
