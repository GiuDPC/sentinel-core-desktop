use tauri::State;
use sqlx::SqlitePool;
use tokio::task;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use uuid::Uuid;
use serde::Deserialize;

use crate::errors::AppError;
use crate::models::{User, UserResponse};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterPayload {
    pub first_name: String,
    pub last_name: String,
    pub email: String,
    pub password: String,
    pub store_number: Option<String>,
    pub store_name: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangePasswordPayload {
    pub user_id: String,
    pub old_password: String,
    pub new_password: String,
}

#[tauri::command]
pub async fn login(
    email: String,
    password: String,
    db: State<'_, SqlitePool>,
) -> Result<UserResponse, AppError> {
    let user: User = sqlx::query_as("SELECT * FROM users WHERE email = ?1 AND is_active = 1")
        .bind(&email)
        .fetch_optional(db.inner())
        .await?
        .ok_or_else(|| AppError::Auth("Credenciales inválidas o usuario inactivo".into()))?;

    let hash = user.password_hash.clone();
    let pwd = password.clone();

    // Argon2 verification in spawn_blocking to avoid locking async runtime
    let valid = task::spawn_blocking(move || {
        let parsed_hash = match argon2::PasswordHash::new(&hash) {
            Ok(h) => h,
            Err(_) => return false,
        };
        Argon2::default().verify_password(pwd.as_bytes(), &parsed_hash).is_ok()
    }).await.map_err(|e| AppError::Internal(e.to_string()))?;

    if !valid {
        return Err(AppError::Auth("Credenciales inválidas".into()));
    }

    Ok(user.into())
}

#[tauri::command]
pub async fn logout() -> Result<(), AppError> {
    // Al no usar JWT, el frontend maneja la eliminación de la sesión en su plugin-store.
    Ok(())
}

#[tauri::command]
pub async fn register_public(
    payload: RegisterPayload,
    db: State<'_, SqlitePool>,
) -> Result<UserResponse, AppError> {
    // Verificar si el email ya existe
    let exists: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users WHERE email = ?1")
        .bind(&payload.email)
        .fetch_one(db.inner())
        .await?;

    if exists.0 > 0 {
        return Err(AppError::Validation("El correo ya está registrado".into()));
    }

    let pwd = payload.password.clone();
    let hash = task::spawn_blocking(move || {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        argon2.hash_password(pwd.as_bytes(), &salt).map(|h| h.to_string())
    }).await.map_err(|e| AppError::Internal(e.to_string()))??;

    let id = Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO users (id, role_id, first_name, last_name, email, password_hash, store_number, store_name, is_active) 
         VALUES (?, 3, ?, ?, ?, ?, ?, ?, 1)"
    )
    .bind(&id)
    .bind(&payload.first_name)
    .bind(&payload.last_name)
    .bind(&payload.email)
    .bind(&hash)
    .bind(&payload.store_number)
    .bind(&payload.store_name)
    .execute(db.inner())
    .await?;

    // Devolver el usuario creado
    let user: User = sqlx::query_as("SELECT * FROM users WHERE id = ?1")
        .bind(&id)
        .fetch_one(db.inner())
        .await?;

    Ok(user.into())
}

#[tauri::command]
pub async fn get_profile(
    user_id: String,
    db: State<'_, SqlitePool>,
) -> Result<UserResponse, AppError> {
    let user: User = sqlx::query_as("SELECT * FROM users WHERE id = ?1")
        .bind(&user_id)
        .fetch_optional(db.inner())
        .await?
        .ok_or_else(|| AppError::NotFound("Usuario no encontrado".into()))?;

    Ok(user.into())
}

#[tauri::command]
pub async fn change_password(
    payload: ChangePasswordPayload,
    db: State<'_, SqlitePool>,
) -> Result<(), AppError> {
    let user: User = sqlx::query_as("SELECT * FROM users WHERE id = ?1 AND is_active = 1")
        .bind(&payload.user_id)
        .fetch_optional(db.inner())
        .await?
        .ok_or_else(|| AppError::NotFound("Usuario no encontrado".into()))?;

    let hash = user.password_hash.clone();
    let old_pwd = payload.old_password.clone();

    let valid = task::spawn_blocking(move || {
        let parsed_hash = match argon2::PasswordHash::new(&hash) {
            Ok(h) => h,
            Err(_) => return false,
        };
        Argon2::default().verify_password(old_pwd.as_bytes(), &parsed_hash).is_ok()
    }).await.map_err(|e| AppError::Internal(e.to_string()))?;

    if !valid {
        return Err(AppError::Auth("Contraseña actual incorrecta".into()));
    }

    let new_pwd = payload.new_password.clone();
    let new_hash = task::spawn_blocking(move || {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        argon2.hash_password(new_pwd.as_bytes(), &salt).map(|h| h.to_string())
    }).await.map_err(|e| AppError::Internal(e.to_string()))??;

    sqlx::query("UPDATE users SET password_hash = ?1, updated_at = datetime('now') WHERE id = ?2")
        .bind(&new_hash)
        .bind(&payload.user_id)
        .execute(db.inner())
        .await?;

    Ok(())
}
