use tauri::State;
use sqlx::SqlitePool;
use uuid::Uuid;
use serde::Deserialize;

use crate::errors::AppError;
use crate::models::{Ticket, Category};
use crate::state_machine::is_valid_transition;
use crate::sla::calculate_due_date;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTicketPayload {
    pub creator_id: String,
    pub category_id: i64,
    pub title: String,
    pub description: String,
    pub location: String,
    pub priority: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateStatusPayload {
    pub ticket_id: String,
    pub status: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolveTicketPayload {
    pub ticket_id: String,
    pub resolution_note: String,
}

#[tauri::command]
pub async fn create_ticket(
    payload: CreateTicketPayload,
    db: State<'_, SqlitePool>,
) -> Result<Ticket, AppError> {
    // Obtener info de la categoría para el SLA
    let cat: Category = sqlx::query_as("SELECT * FROM categories WHERE id = ?1")
        .bind(payload.category_id)
        .fetch_optional(db.inner())
        .await?
        .ok_or_else(|| AppError::NotFound("Categoría no encontrada".into()))?;

    let id = Uuid::new_v4().to_string();
    let ticket_code = format!("TKT-{}", &id[..8].to_uppercase());
    
    // SQLite requiere string ISO. SQLite usa UTC por defecto.
    let now_str: String = sqlx::query_scalar("SELECT datetime('now')")
        .fetch_one(db.inner())
        .await?;
        
    let due_date = calculate_due_date(&now_str, cat.sla_hours);

    sqlx::query(
        "INSERT INTO tickets (id, ticket_code, creator_id, category_id, title, description, location, status, priority, due_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?)"
    )
    .bind(&id)
    .bind(&ticket_code)
    .bind(&payload.creator_id)
    .bind(payload.category_id)
    .bind(&payload.title)
    .bind(&payload.description)
    .bind(&payload.location)
    .bind(&payload.priority)
    .bind(&due_date)
    .execute(db.inner())
    .await?;

    let ticket: Ticket = sqlx::query_as("SELECT * FROM tickets WHERE id = ?1")
        .bind(&id)
        .fetch_one(db.inner())
        .await?;

    Ok(ticket)
}

#[tauri::command]
pub async fn get_tickets(db: State<'_, SqlitePool>) -> Result<Vec<Ticket>, AppError> {
    let tickets = sqlx::query_as("SELECT * FROM tickets ORDER BY created_at DESC")
        .fetch_all(db.inner())
        .await?;
    Ok(tickets)
}

#[tauri::command]
pub async fn get_ticket(id: String, db: State<'_, SqlitePool>) -> Result<Ticket, AppError> {
    let ticket = sqlx::query_as("SELECT * FROM tickets WHERE id = ?1")
        .bind(&id)
        .fetch_optional(db.inner())
        .await?
        .ok_or_else(|| AppError::NotFound("Ticket no encontrado".into()))?;
    Ok(ticket)
}

#[tauri::command]
pub async fn get_my_tickets(user_id: String, db: State<'_, SqlitePool>) -> Result<Vec<Ticket>, AppError> {
    let tickets = sqlx::query_as("SELECT * FROM tickets WHERE creator_id = ?1 ORDER BY created_at DESC")
        .bind(&user_id)
        .fetch_all(db.inner())
        .await?;
    Ok(tickets)
}

#[tauri::command]
pub async fn get_assigned_tickets(technician_id: String, db: State<'_, SqlitePool>) -> Result<Vec<Ticket>, AppError> {
    let tickets = sqlx::query_as(
        "SELECT t.* FROM tickets t
         INNER JOIN assignments a ON t.id = a.ticket_id
         WHERE a.technician_id = ?1 ORDER BY t.created_at DESC"
    )
    .bind(&technician_id)
    .fetch_all(db.inner())
    .await?;
    Ok(tickets)
}

#[tauri::command]
pub async fn update_ticket_status(
    payload: UpdateStatusPayload,
    db: State<'_, SqlitePool>,
) -> Result<Ticket, AppError> {
    let current_ticket: Ticket = sqlx::query_as("SELECT * FROM tickets WHERE id = ?1")
        .bind(&payload.ticket_id)
        .fetch_optional(db.inner())
        .await?
        .ok_or_else(|| AppError::NotFound("Ticket no encontrado".into()))?;

    if !is_valid_transition(&current_ticket.status, &payload.status) {
        return Err(AppError::Validation(format!(
            "Transición inválida de {} a {}",
            current_ticket.status, payload.status
        )));
    }

    sqlx::query("UPDATE tickets SET status = ?1, updated_at = datetime('now') WHERE id = ?2")
        .bind(&payload.status)
        .bind(&payload.ticket_id)
        .execute(db.inner())
        .await?;

    let updated = sqlx::query_as("SELECT * FROM tickets WHERE id = ?1")
        .bind(&payload.ticket_id)
        .fetch_one(db.inner())
        .await?;

    Ok(updated)
}

#[tauri::command]
pub async fn resolve_ticket(
    payload: ResolveTicketPayload,
    db: State<'_, SqlitePool>,
) -> Result<Ticket, AppError> {
    let current_ticket: Ticket = sqlx::query_as("SELECT * FROM tickets WHERE id = ?1")
        .bind(&payload.ticket_id)
        .fetch_optional(db.inner())
        .await?
        .ok_or_else(|| AppError::NotFound("Ticket no encontrado".into()))?;

    if !is_valid_transition(&current_ticket.status, "RESOLVED") {
        return Err(AppError::Validation("El ticket no puede ser resuelto desde este estado".into()));
    }

    sqlx::query("UPDATE tickets SET status = 'RESOLVED', resolution_note = ?1, resolved_at = datetime('now'), updated_at = datetime('now') WHERE id = ?2")
        .bind(&payload.resolution_note)
        .bind(&payload.ticket_id)
        .execute(db.inner())
        .await?;

    let updated = sqlx::query_as("SELECT * FROM tickets WHERE id = ?1")
        .bind(&payload.ticket_id)
        .fetch_one(db.inner())
        .await?;

    Ok(updated)
}

#[tauri::command]
pub async fn confirm_ticket(
    ticket_id: String,
    db: State<'_, SqlitePool>,
) -> Result<Ticket, AppError> {
    let current_ticket: Ticket = sqlx::query_as("SELECT * FROM tickets WHERE id = ?1")
        .bind(&ticket_id)
        .fetch_optional(db.inner())
        .await?
        .ok_or_else(|| AppError::NotFound("Ticket no encontrado".into()))?;

    if !is_valid_transition(&current_ticket.status, "CLOSED") {
        return Err(AppError::Validation("El ticket no puede ser cerrado (confirmado) desde este estado".into()));
    }

    sqlx::query("UPDATE tickets SET status = 'CLOSED', updated_at = datetime('now') WHERE id = ?1")
        .bind(&ticket_id)
        .execute(db.inner())
        .await?;

    let updated = sqlx::query_as("SELECT * FROM tickets WHERE id = ?1")
        .bind(&ticket_id)
        .fetch_one(db.inner())
        .await?;

    Ok(updated)
}
