use tauri::State;
use sqlx::SqlitePool;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use crate::errors::AppError;

use super::tickets::create_notification;

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

    // Get ticket info for notifications
    let ticket_info: (String, String, String) = sqlx::query_as(
        "SELECT t.ticket_code, t.creator_id, t.title FROM tickets t WHERE t.id = ?1"
    )
    .bind(&payload.ticket_id)
    .fetch_optional(db.inner())
    .await?
    .ok_or_else(|| AppError::NotFound("Ticket no encontrado".into()))?;

    let (ticket_code, creator_id, _ticket_title) = ticket_info;

    // Check if commenter is the creator → notify assigned technicians
    if payload.user_id == creator_id {
        let tech_ids: Vec<(String,)> = sqlx::query_as(
            "SELECT technician_id FROM assignments WHERE ticket_id = ?1"
        )
        .bind(&payload.ticket_id)
        .fetch_all(db.inner())
        .await?;
        for (tid,) in &tech_ids {
            create_notification(
                db.inner(), tid, "Nuevo comentario del solicitante",
                &format!("{} comentó en el ticket {}", payload.user_id, ticket_code),
                "COMMENT", Some(&format!("/technician/ticket/{}", payload.ticket_id)),
            ).await?;
        }
    }

    // If staff commented and NOT internal → notify creator
    if payload.is_internal == 0 && payload.user_id != creator_id {
        create_notification(
            db.inner(), &creator_id, "Nuevo comentario del equipo técnico",
            &format!("El equipo técnico respondió en tu ticket {}", ticket_code),
            "COMMENT", Some(&format!("/requester/my-tickets?id={}", payload.ticket_id)),
        ).await?;
    }

    Ok(comment)
}

#[tauri::command]
pub async fn get_comments(
    ticket_id: String,
    user_role: Option<String>,
    db: State<'_, SqlitePool>,
) -> Result<Vec<Comment>, AppError> {
    let comments = if user_role.as_deref() == Some("REQUESTER") {
        // REQUESTER cannot see internal comments
        sqlx::query_as("SELECT * FROM comments WHERE ticket_id = ?1 AND is_internal = 0 ORDER BY created_at ASC")
            .bind(&ticket_id)
            .fetch_all(db.inner())
            .await?
    } else {
        sqlx::query_as("SELECT * FROM comments WHERE ticket_id = ?1 ORDER BY created_at ASC")
            .bind(&ticket_id)
            .fetch_all(db.inner())
            .await?
    };
    Ok(comments)
}
