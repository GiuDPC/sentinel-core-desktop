use tauri::State;
use sqlx::SqlitePool;
use serde::Serialize;

use crate::errors::AppError;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardMetrics {
    pub total_open: i64,
    pub total_assigned: i64,
    pub total_resolved: i64,
    pub total_closed: i64,
}

#[tauri::command]
pub async fn get_dashboard_metrics(db: State<'_, SqlitePool>) -> Result<DashboardMetrics, AppError> {
    let open: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM tickets WHERE status = 'OPEN'").fetch_one(db.inner()).await?;
    let assigned: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM tickets WHERE status = 'ASSIGNED'").fetch_one(db.inner()).await?;
    let resolved: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM tickets WHERE status = 'RESOLVED'").fetch_one(db.inner()).await?;
    let closed: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM tickets WHERE status = 'CLOSED'").fetch_one(db.inner()).await?;

    Ok(DashboardMetrics {
        total_open: open.0,
        total_assigned: assigned.0,
        total_resolved: resolved.0,
        total_closed: closed.0,
    })
}

// Podríamos añadir más métricas según lo necesite el frontend
