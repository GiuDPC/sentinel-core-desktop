use tauri::State;
use sqlx::SqlitePool;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use crate::errors::AppError;

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Comment {
    pub id: String,
    pub ticket_id: String,
    pub user_id: String,
    pub content: String,
    pub is_internal: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCommentPayload {
    pub ticket_id: String,
    pub user_id: String,
    pub content: String,
    pub is_internal: i64,
}

#[tauri::command]
pub async fn create_comment(
    payload: CreateCommentPayload,
    db: State<'_, SqlitePool>,
) -> Result<Comment, AppError> {
    let id = Uuid::new_v4().to_string();
    
    sqlx::query("INSERT INTO comments (id, ticket_id, user_id, content, is_internal) VALUES (?, ?, ?, ?, ?)")
        .bind(&id)
        .bind(&payload.ticket_id)
        .bind(&payload.user_id)
        .bind(&payload.content)
        .bind(payload.is_internal)
        .execute(db.inner())
        .await?;

    let comment = sqlx::query_as("SELECT * FROM comments WHERE id = ?")
        .bind(&id)
        .fetch_one(db.inner())
        .await?;

    Ok(comment)
}

#[tauri::command]
pub async fn get_comments(
    ticket_id: String,
    db: State<'_, SqlitePool>,
) -> Result<Vec<Comment>, AppError> {
    let comments = sqlx::query_as("SELECT * FROM comments WHERE ticket_id = ? ORDER BY created_at ASC")
        .bind(&ticket_id)
        .fetch_all(db.inner())
        .await?;
    Ok(comments)
}
