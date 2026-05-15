use tauri::State;
use sqlx::SqlitePool;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use crate::errors::AppError;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Notification {
    pub id: String,
    pub user_id: String,
    pub title: String,
    pub message: String,
    #[serde(rename = "type")]
    pub r#type: String,
    pub link: Option<String>,
    pub is_read: i64,
    pub created_at: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateNotificationPayload {
    pub user_id: String,
    pub title: String,
    pub message: String,
    pub r#type: String,
    pub link: Option<String>,
}

#[tauri::command]
pub async fn get_notifications(
    user_id: String,
    db: State<'_, SqlitePool>,
) -> Result<Vec<Notification>, AppError> {
    let notifs = sqlx::query_as("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC")
        .bind(&user_id)
        .fetch_all(db.inner())
        .await?;
    Ok(notifs)
}

#[tauri::command]
pub async fn mark_as_read(
    id: String,
    db: State<'_, SqlitePool>,
) -> Result<(), AppError> {
    sqlx::query("UPDATE notifications SET is_read = 1 WHERE id = ?")
        .bind(&id)
        .execute(db.inner())
        .await?;
    Ok(())
}

#[tauri::command]
pub async fn mark_all_as_read(
    user_id: String,
    db: State<'_, SqlitePool>,
) -> Result<(), AppError> {
    sqlx::query("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0")
        .bind(&user_id)
        .execute(db.inner())
        .await?;
    Ok(())
}
