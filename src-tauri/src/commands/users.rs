use tauri::State;
use sqlx::SqlitePool;
use serde::Deserialize;

use crate::errors::AppError;
use crate::models::UserResponse;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserPayload {
    pub id: String,
    pub role_id: i64,
    pub first_name: String,
    pub last_name: String,
    pub department: Option<String>,
    pub store_number: Option<String>,
    pub store_name: Option<String>,
}

#[tauri::command]
pub async fn get_users(db: State<'_, SqlitePool>) -> Result<Vec<UserResponse>, AppError> {
    let users = sqlx::query_as::<_, crate::models::User>("SELECT * FROM users ORDER BY created_at DESC")
        .fetch_all(db.inner())
        .await?;
        
    let res = users.into_iter().map(|u| u.into()).collect();
    Ok(res)
}

#[tauri::command]
pub async fn get_user(id: String, db: State<'_, SqlitePool>) -> Result<UserResponse, AppError> {
    let user: crate::models::User = sqlx::query_as("SELECT * FROM users WHERE id = ?")
        .bind(&id)
        .fetch_optional(db.inner())
        .await?
        .ok_or_else(|| AppError::NotFound("Usuario no encontrado".into()))?;
    Ok(user.into())
}

#[tauri::command]
pub async fn update_user(
    payload: UpdateUserPayload,
    db: State<'_, SqlitePool>,
) -> Result<UserResponse, AppError> {
    sqlx::query(
        "UPDATE users SET role_id = ?, first_name = ?, last_name = ?, department = ?, store_number = ?, store_name = ?, updated_at = datetime('now') WHERE id = ?"
    )
    .bind(payload.role_id)
    .bind(&payload.first_name)
    .bind(&payload.last_name)
    .bind(&payload.department)
    .bind(&payload.store_number)
    .bind(&payload.store_name)
    .bind(&payload.id)
    .execute(db.inner())
    .await?;

    let user: crate::models::User = sqlx::query_as("SELECT * FROM users WHERE id = ?")
        .bind(&payload.id)
        .fetch_one(db.inner())
        .await?;
    Ok(user.into())
}

#[tauri::command]
pub async fn deactivate_user(
    id: String,
    db: State<'_, SqlitePool>,
) -> Result<(), AppError> {
    sqlx::query("UPDATE users SET is_active = 0, updated_at = datetime('now') WHERE id = ?")
        .bind(&id)
        .execute(db.inner())
        .await?;
    Ok(())
}
