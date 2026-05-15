use tauri::State;
use sqlx::SqlitePool;
use serde::Deserialize;

use crate::errors::AppError;
use crate::models::UserResponse;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserPayload {
    pub id: String,
    pub role_id: Option<i64>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub department: Option<String>,
    pub store_number: Option<String>,
    pub store_name: Option<String>,
    pub is_active: Option<bool>,
}

async fn user_to_full_response(user: &crate::models::User, pool: &SqlitePool) -> UserResponse {
    let role_name = crate::models::User::get_role_name(pool, user.role_id).await;
    UserResponse {
        id: user.id.clone(),
        role_id: user.role_id,
        role: role_name,
        first_name: user.first_name.clone(),
        last_name: user.last_name.clone(),
        email: user.email.clone(),
        phone: user.phone.clone(),
        department: user.department.clone(),
        store_number: user.store_number.clone(),
        store_name: user.store_name.clone(),
        is_active: user.is_active,
        created_at: user.created_at.clone(),
        updated_at: user.updated_at.clone(),
    }
}

#[tauri::command]
pub async fn get_users(db: State<'_, SqlitePool>) -> Result<Vec<UserResponse>, AppError> {
    let users = sqlx::query_as::<_, crate::models::User>("SELECT * FROM users ORDER BY created_at DESC")
        .fetch_all(db.inner())
        .await?;
        
    let mut res = Vec::new();
    for u in &users {
        res.push(user_to_full_response(u, db.inner()).await);
    }
    Ok(res)
}

#[tauri::command]
pub async fn get_user(id: String, db: State<'_, SqlitePool>) -> Result<UserResponse, AppError> {
    let user: crate::models::User = sqlx::query_as("SELECT * FROM users WHERE id = ?")
        .bind(&id)
        .fetch_optional(db.inner())
        .await?
        .ok_or_else(|| AppError::NotFound("Usuario no encontrado".into()))?;
    Ok(user_to_full_response(&user, db.inner()).await)
}

#[tauri::command]
pub async fn update_user(
    payload: UpdateUserPayload,
    db: State<'_, SqlitePool>,
) -> Result<UserResponse, AppError> {
    // Read current values
    let current: crate::models::User = sqlx::query_as("SELECT * FROM users WHERE id = ?")
        .bind(&payload.id)
        .fetch_optional(db.inner())
        .await?
        .ok_or_else(|| AppError::NotFound("Usuario no encontrado".into()))?;

    // Override with provided values
    let role_id = payload.role_id.unwrap_or(current.role_id);
    let first_name = payload.first_name.unwrap_or(current.first_name);
    let last_name = payload.last_name.unwrap_or(current.last_name);
    let department = payload.department.or(current.department);
    let store_number = payload.store_number.or(current.store_number);
    let store_name = payload.store_name.or(current.store_name);
    let is_active = payload.is_active.map(|b| if b { 1_i64 } else { 0_i64 }).unwrap_or(current.is_active);

    sqlx::query(
        "UPDATE users SET role_id = ?1, first_name = ?2, last_name = ?3, department = ?4, store_number = ?5, store_name = ?6, is_active = ?7, updated_at = datetime('now') WHERE id = ?8"
    )
    .bind(role_id)
    .bind(&first_name)
    .bind(&last_name)
    .bind(&department)
    .bind(&store_number)
    .bind(&store_name)
    .bind(is_active)
    .bind(&payload.id)
    .execute(db.inner())
    .await?;

    let user: crate::models::User = sqlx::query_as("SELECT * FROM users WHERE id = ?")
        .bind(&payload.id)
        .fetch_one(db.inner())
        .await?;
    Ok(user_to_full_response(&user, db.inner()).await)
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
