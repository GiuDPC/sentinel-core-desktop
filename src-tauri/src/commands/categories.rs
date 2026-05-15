use tauri::State;
use sqlx::SqlitePool;
use serde::Deserialize;

use crate::errors::AppError;
use crate::models::Category;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCategoryPayload {
    pub name: String,
    pub department: String,
    pub sla_hours: i64,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCategoryPayload {
    pub id: i64,
    pub name: String,
    pub department: String,
    pub sla_hours: i64,
    pub is_active: i64,
}

#[tauri::command]
pub async fn get_categories(db: State<'_, SqlitePool>) -> Result<Vec<Category>, AppError> {
    let cats = sqlx::query_as("SELECT * FROM categories ORDER BY name ASC")
        .fetch_all(db.inner())
        .await?;
    Ok(cats)
}

#[tauri::command]
pub async fn get_category(id: i64, db: State<'_, SqlitePool>) -> Result<Category, AppError> {
    let cat = sqlx::query_as("SELECT * FROM categories WHERE id = ?1")
        .bind(id)
        .fetch_optional(db.inner())
        .await?
        .ok_or_else(|| AppError::NotFound("Categoría no encontrada".into()))?;
    Ok(cat)
}

#[tauri::command]
pub async fn create_category(
    payload: CreateCategoryPayload,
    db: State<'_, SqlitePool>,
) -> Result<Category, AppError> {
    sqlx::query("INSERT INTO categories (name, department, sla_hours) VALUES (?, ?, ?)")
        .bind(&payload.name)
        .bind(&payload.department)
        .bind(payload.sla_hours)
        .execute(db.inner())
        .await?;

    // Use last_insert_rowid() instead of sqlite_sequence (which is fragile)
    let cat = sqlx::query_as("SELECT * FROM categories WHERE id = last_insert_rowid()")
        .fetch_one(db.inner())
        .await?;
    Ok(cat)
}

#[tauri::command]
pub async fn update_category(
    payload: UpdateCategoryPayload,
    db: State<'_, SqlitePool>,
) -> Result<Category, AppError> {
    sqlx::query("UPDATE categories SET name = ?, department = ?, sla_hours = ?, is_active = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(&payload.name)
        .bind(&payload.department)
        .bind(payload.sla_hours)
        .bind(payload.is_active)
        .bind(payload.id)
        .execute(db.inner())
        .await?;

    let cat = sqlx::query_as("SELECT * FROM categories WHERE id = ?")
        .bind(payload.id)
        .fetch_one(db.inner())
        .await?;
    Ok(cat)
}

#[tauri::command]
pub async fn delete_category(
    id: i64,
    db: State<'_, SqlitePool>,
) -> Result<(), AppError> {
    sqlx::query("UPDATE categories SET is_active = 0, updated_at = datetime('now') WHERE id = ?")
        .bind(id)
        .execute(db.inner())
        .await?;
    Ok(())
}
