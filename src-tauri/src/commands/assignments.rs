use tauri::State;
use sqlx::SqlitePool;
use serde::Deserialize;

use crate::errors::AppError;
use crate::models::*;
use crate::commands::tickets::{create_audit_log, create_notification};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssignPayload {
    pub ticket_id: String,
    pub technician_id: String,
    pub assigned_by: Option<String>,
}

#[tauri::command]
pub async fn assign_technician(
    payload: AssignPayload,
    db: State<'_, SqlitePool>,
) -> Result<(), AppError> {
    let ticket_info: (String, String) = sqlx::query_as(
        "SELECT ticket_code, creator_id FROM tickets WHERE id = ?1"
    )
    .bind(&payload.ticket_id)
    .fetch_optional(db.inner())
    .await?
    .ok_or_else(|| AppError::NotFound("Ticket no encontrado".into()))?;

    let (ticket_code, _) = ticket_info;

    // Validar que el técnico existe y es TECHNICIAN
    let tech_role: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM users u INNER JOIN roles r ON r.id = u.role_id
         WHERE u.id = ?1 AND u.is_active = 1 AND r.name = 'TECHNICIAN'"
    )
    .bind(&payload.technician_id)
    .fetch_one(db.inner())
    .await?;

    if tech_role.0 == 0 {
        return Err(AppError::Validation("El usuario seleccionado no es un técnico válido".into()));
    }

    // Verificar que no esté ya asignado
    let existing: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM assignments WHERE ticket_id = ?1 AND technician_id = ?2"
    )
    .bind(&payload.ticket_id)
    .bind(&payload.technician_id)
    .fetch_one(db.inner())
    .await?;

    if existing.0 > 0 {
        return Err(AppError::Validation("Este técnico ya está asignado a este ticket".into()));
    }

    sqlx::query("INSERT INTO assignments (ticket_id, technician_id) VALUES (?, ?)")
        .bind(&payload.ticket_id)
        .bind(&payload.technician_id)
        .execute(db.inner())
        .await?;

    // Update status only if OPEN
    sqlx::query("UPDATE tickets SET status = 'ASSIGNED', updated_at = datetime('now') WHERE id = ? AND status = 'OPEN'")
        .bind(&payload.ticket_id)
        .execute(db.inner())
        .await?;

    let assigned_by = payload.assigned_by.as_deref().unwrap_or("system");

    // Audit log
    create_audit_log(
        db.inner(), &payload.ticket_id, assigned_by, "ASSIGNMENT",
        None, Some(&payload.technician_id),
    ).await?;

    // Notify technician
    create_notification(
        db.inner(), &payload.technician_id, "Nueva asignación",
        &format!("Se te ha asignado el ticket {}", ticket_code),
        "ASSIGNMENT", Some(&format!("/technician/ticket/{}", payload.ticket_id)),
    ).await?;

    Ok(())
}

#[tauri::command]
pub async fn reassign_technician(
    payload: AssignPayload,
    db: State<'_, SqlitePool>,
) -> Result<(), AppError> {
    // Find old technician for notification
    let old_techs: Vec<(String,)> = sqlx::query_as(
        "SELECT technician_id FROM assignments WHERE ticket_id = ?1"
    )
    .bind(&payload.ticket_id)
    .fetch_all(db.inner())
    .await?;

    // Verificar ticket existe y no está cerrado
    let ticket_status: (String,) = sqlx::query_as(
        "SELECT status FROM tickets WHERE id = ?1"
    )
    .bind(&payload.ticket_id)
    .fetch_optional(db.inner())
    .await?
    .ok_or_else(|| AppError::NotFound("Ticket no encontrado".into()))?;

    if ticket_status.0 == "CLOSED" {
        return Err(AppError::Validation("No se puede reasignar un ticket cerrado".into()));
    }

    // Validar que el nuevo técnico existe y es TECHNICIAN
    let tech_role: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM users u INNER JOIN roles r ON r.id = u.role_id
         WHERE u.id = ?1 AND u.is_active = 1 AND r.name = 'TECHNICIAN'"
    )
    .bind(&payload.technician_id)
    .fetch_one(db.inner())
    .await?;

    if tech_role.0 == 0 {
        return Err(AppError::Validation("El usuario seleccionado no es un técnico válido".into()));
    }

    // Delete old assignments
    sqlx::query("DELETE FROM assignments WHERE ticket_id = ?")
        .bind(&payload.ticket_id)
        .execute(db.inner())
        .await?;

    // Assign new
    sqlx::query("INSERT INTO assignments (ticket_id, technician_id) VALUES (?, ?)")
        .bind(&payload.ticket_id)
        .bind(&payload.technician_id)
        .execute(db.inner())
        .await?;

    // Si estaba en OPEN, pasarlo a ASSIGNED
    if ticket_status.0 == "OPEN" {
        sqlx::query("UPDATE tickets SET status = 'ASSIGNED', updated_at = datetime('now') WHERE id = ?")
            .bind(&payload.ticket_id)
            .execute(db.inner())
            .await?;
    }

    let assigned_by = payload.assigned_by.as_deref().unwrap_or("system");

    // Audit log
    create_audit_log(
        db.inner(), &payload.ticket_id, assigned_by, "REASSIGNMENT",
        old_techs.first().map(|t| t.0.as_str()), Some(&payload.technician_id),
    ).await?;

    // Notify new technician
    create_notification(
        db.inner(), &payload.technician_id, "Reasignación",
        "Se te ha reasignado el ticket para atención",
        "ASSIGNMENT", Some(&format!("/technician/ticket/{}", payload.ticket_id)),
    ).await?;

    Ok(())
}

#[tauri::command]
pub async fn get_workload(
    department: String,
    db: State<'_, SqlitePool>,
) -> Result<WorkloadResponse, AppError> {
    let technicians: Vec<WorkloadTechInfo> = sqlx::query_as::<_, (String, String, String, Option<String>, i64)>(
        "SELECT u.id, u.first_name, u.last_name, u.department,
                COALESCE((SELECT COUNT(*) FROM assignments a
                 INNER JOIN tickets t ON t.id = a.ticket_id
                 WHERE a.technician_id = u.id AND t.status NOT IN ('RESOLVED', 'CLOSED')), 0) as active_count
         FROM users u
         WHERE u.role_id = (SELECT id FROM roles WHERE name = 'TECHNICIAN')
           AND u.is_active = 1
           AND (?1 = '' OR u.department = ?1)
         ORDER BY active_count ASC"
    )
    .bind(&department)
    .fetch_all(db.inner())
    .await?
    .into_iter()
    .map(|(id, first_name, last_name, dept, active_tickets)| {
        WorkloadTechInfo { id, first_name, last_name, department: dept, active_tickets }
    })
    .collect();

    // Suggested = first one (least loaded)
    let suggested = technicians.first().map(|t| t.id.clone());

    Ok(WorkloadResponse { technicians, suggested })
}
