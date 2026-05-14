use tauri::State;
use sqlx::SqlitePool;
use serde::{Deserialize, Serialize};

use crate::errors::AppError;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssignPayload {
    pub ticket_id: String,
    pub technician_id: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkloadResponse {
    pub technician_id: String,
    pub active_count: i64,
}

#[tauri::command]
pub async fn assign_technician(
    payload: AssignPayload,
    db: State<'_, SqlitePool>,
) -> Result<(), AppError> {
    // Asignar en la tabla pivote
    sqlx::query("INSERT OR REPLACE INTO assignments (ticket_id, technician_id) VALUES (?, ?)")
        .bind(&payload.ticket_id)
        .bind(&payload.technician_id)
        .execute(db.inner())
        .await?;

    // Actualizar estado del ticket a ASSIGNED
    sqlx::query("UPDATE tickets SET status = 'ASSIGNED', updated_at = datetime('now') WHERE id = ? AND status = 'OPEN'")
        .bind(&payload.ticket_id)
        .execute(db.inner())
        .await?;

    Ok(())
}

#[tauri::command]
pub async fn reassign_technician(
    payload: AssignPayload,
    db: State<'_, SqlitePool>,
) -> Result<(), AppError> {
    // Borrar asignación previa
    sqlx::query("DELETE FROM assignments WHERE ticket_id = ?")
        .bind(&payload.ticket_id)
        .execute(db.inner())
        .await?;

    // Asignar al nuevo técnico
    sqlx::query("INSERT INTO assignments (ticket_id, technician_id) VALUES (?, ?)")
        .bind(&payload.ticket_id)
        .bind(&payload.technician_id)
        .execute(db.inner())
        .await?;

    Ok(())
}

#[tauri::command]
pub async fn get_workload(
    department: String,
    db: State<'_, SqlitePool>,
) -> Result<Vec<WorkloadResponse>, AppError> {
    let workload = sqlx::query_as::<_, (String, i64)>(
        "SELECT u.id, COUNT(a.ticket_id) as active_count
         FROM users u
         LEFT JOIN assignments a ON u.id = a.technician_id
           AND a.ticket_id IN (
             SELECT id FROM tickets WHERE status NOT IN ('RESOLVED', 'CLOSED')
           )
         WHERE u.role_id = (SELECT id FROM roles WHERE name = 'TECHNICIAN')
           AND u.is_active = 1
           AND u.department = ?1
         GROUP BY u.id
         ORDER BY active_count ASC"
    )
    .bind(&department)
    .fetch_all(db.inner())
    .await?;

    let res = workload.into_iter().map(|w| WorkloadResponse {
        technician_id: w.0,
        active_count: w.1,
    }).collect();

    Ok(res)
}
