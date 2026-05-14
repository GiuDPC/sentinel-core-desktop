use tauri::State;
use sqlx::SqlitePool;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use crate::errors::AppError;

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct AuditLog {
    pub id: String,
    pub ticket_id: String,
    pub user_id: String,
    pub action: String,
    pub old_value: Option<String>,
    pub new_value: Option<String>,
    pub created_at: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAuditLogPayload {
    pub ticket_id: String,
    pub user_id: String,
    pub action: String,
    pub old_value: Option<String>,
    pub new_value: Option<String>,
}

#[tauri::command]
pub async fn get_audit_by_ticket(
    ticket_id: String,
    db: State<'_, SqlitePool>,
) -> Result<Vec<AuditLog>, AppError> {
    let logs = sqlx::query_as("SELECT * FROM audit_logs WHERE ticket_id = ? ORDER BY created_at ASC")
        .bind(&ticket_id)
        .fetch_all(db.inner())
        .await?;
    Ok(logs)
}

#[tauri::command]
pub async fn get_audit_logs(db: State<'_, SqlitePool>) -> Result<Vec<AuditLog>, AppError> {
    let logs = sqlx::query_as("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100")
        .fetch_all(db.inner())
        .await?;
    Ok(logs)
}
