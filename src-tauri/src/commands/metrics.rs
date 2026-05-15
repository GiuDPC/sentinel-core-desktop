use tauri::State;
use sqlx::SqlitePool;

use crate::errors::AppError;
use crate::models::*;

#[tauri::command]
pub async fn get_dashboard_metrics(db: State<'_, SqlitePool>) -> Result<DashboardMetricsResponse, AppError> {
    let total_tickets: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM tickets").fetch_one(db.inner()).await?;
    let open: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM tickets WHERE status = 'OPEN'").fetch_one(db.inner()).await?;
    let assigned: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM tickets WHERE status = 'ASSIGNED'").fetch_one(db.inner()).await?;
    let in_progress: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM tickets WHERE status = 'IN_PROGRESS'").fetch_one(db.inner()).await?;
    let on_hold: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM tickets WHERE status = 'ON_HOLD'").fetch_one(db.inner()).await?;
    let resolved: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM tickets WHERE status = 'RESOLVED'").fetch_one(db.inner()).await?;
    let awaiting: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM tickets WHERE status = 'AWAITING_CONFIRMATION'").fetch_one(db.inner()).await?;
    let closed: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM tickets WHERE status = 'CLOSED'").fetch_one(db.inner()).await?;

    let total_open = open.0 + assigned.0 + in_progress.0 + on_hold.0 + awaiting.0;
    let total_resolved = resolved.0;
    let total_closed = closed.0;

    // SLA: breached tickets (past due_date and not closed/resolved)
    let sla_breached: i64 = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM tickets WHERE due_date IS NOT NULL AND due_date < datetime('now') AND status NOT IN ('RESOLVED', 'CLOSED')"
    ).fetch_one(db.inner()).await.unwrap_or(0);

    // SLA at risk (due within 2 hours)
    let sla_at_risk: i64 = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM tickets WHERE due_date IS NOT NULL AND due_date > datetime('now') AND due_date < datetime('now', '+2 hours') AND status NOT IN ('RESOLVED', 'CLOSED')"
    ).fetch_one(db.inner()).await.unwrap_or(0);

    // Average resolution time in hours
    let avg_hours: f64 = sqlx::query_scalar::<_, f64>(
        "SELECT COALESCE(AVG(CAST(julianday(resolved_at) - julianday(created_at) AS FLOAT) * 24), 0)
         FROM tickets WHERE resolved_at IS NOT NULL"
    ).fetch_one(db.inner()).await.unwrap_or(0.0);

    // Tickets this month
    let this_month: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM tickets WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')"
    ).fetch_one(db.inner()).await?;

    // Trend (previous month comparison)
    let prev_month: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM tickets WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', '-1 month')"
    ).fetch_one(db.inner()).await?;

    let trend = if prev_month.0 > 0 {
        ((this_month.0 - prev_month.0) as f64 / prev_month.0 as f64) * 100.0
    } else {
        0.0
    };

    // Tickets by category
    let tickets_by_category: Vec<CategoryCount> = sqlx::query_as::<_, (String, i64)>(
        "SELECT c.name, COUNT(t.id) as cnt FROM tickets t
         INNER JOIN categories c ON c.id = t.category_id
         GROUP BY c.id, c.name ORDER BY cnt DESC"
    )
    .fetch_all(db.inner())
    .await?
    .into_iter()
    .map(|(category, count)| CategoryCount { category, count })
    .collect();

    // Tickets by status
    let tickets_by_status: Vec<StatusCount> = sqlx::query_as::<_, (String, i64)>(
        "SELECT status, COUNT(*) as cnt FROM tickets GROUP BY status ORDER BY cnt DESC"
    )
    .fetch_all(db.inner())
    .await?
    .into_iter()
    .map(|(status, count)| StatusCount { status, count })
    .collect();

    // Tickets by priority
    let tickets_by_priority: Vec<PriorityCount> = sqlx::query_as::<_, (String, i64)>(
        "SELECT priority, COUNT(*) as cnt FROM tickets GROUP BY priority ORDER BY CASE priority WHEN 'CRITICAL' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 3 ELSE 4 END"
    )
    .fetch_all(db.inner())
    .await?
    .into_iter()
    .map(|(priority, count)| PriorityCount { priority, count })
    .collect();

    Ok(DashboardMetricsResponse {
        summary: MetricsSummary {
            total_tickets: total_tickets.0,
            open_tickets: total_open,
            assigned_tickets: assigned.0,
            in_progress_tickets: in_progress.0,
            resolved_tickets: total_resolved,
            closed_tickets: total_closed,
            sla_breached,
            sla_at_risk,
            avg_resolution_hours: (avg_hours * 100.0).round() / 100.0,
            tickets_this_month: this_month.0,
            trend_percentage: (trend * 100.0).round() / 100.0,
        },
        tickets_by_category,
        tickets_by_status,
        tickets_by_priority,
    })
}

#[tauri::command]
pub async fn get_sla_breached(
    db: State<'_, SqlitePool>,
) -> Result<Vec<TicketListItem>, AppError> {
    let tickets: Vec<crate::models::Ticket> = sqlx::query_as(
        "SELECT * FROM tickets WHERE due_date IS NOT NULL AND due_date < datetime('now') AND status NOT IN ('RESOLVED', 'CLOSED') ORDER BY due_date ASC"
    )
    .fetch_all(db.inner())
    .await?;

    let mut enriched = Vec::new();
    for ticket in &tickets {
        enriched.push(crate::commands::tickets::enrich_ticket(db.inner(), ticket).await?);
    }
    Ok(enriched)
}

#[tauri::command]
pub async fn get_technician_metrics(
    user_id: String,
    db: State<'_, SqlitePool>,
) -> Result<TechnicianMetricsResponse, AppError> {
    let total_assigned: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM assignments a INNER JOIN tickets t ON t.id = a.ticket_id WHERE a.technician_id = ?1"
    )
    .bind(&user_id).fetch_one(db.inner()).await?;

    let in_progress: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM assignments a INNER JOIN tickets t ON t.id = a.ticket_id WHERE a.technician_id = ?1 AND t.status = 'IN_PROGRESS'"
    )
    .bind(&user_id).fetch_one(db.inner()).await?;

    let resolved: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM assignments a INNER JOIN tickets t ON t.id = a.ticket_id WHERE a.technician_id = ?1 AND t.status = 'RESOLVED'"
    )
    .bind(&user_id).fetch_one(db.inner()).await?;

    let sla_breached: i64 = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM assignments a INNER JOIN tickets t ON t.id = a.ticket_id
         WHERE a.technician_id = ?1 AND t.due_date IS NOT NULL AND t.due_date < datetime('now') AND t.status NOT IN ('RESOLVED', 'CLOSED')"
    )
    .bind(&user_id).fetch_one(db.inner()).await.unwrap_or(0);

    let sla_at_risk: i64 = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM assignments a INNER JOIN tickets t ON t.id = a.ticket_id
         WHERE a.technician_id = ?1 AND t.due_date IS NOT NULL AND t.due_date > datetime('now') AND t.due_date < datetime('now', '+2 hours') AND t.status NOT IN ('RESOLVED', 'CLOSED')"
    )
    .bind(&user_id).fetch_one(db.inner()).await.unwrap_or(0);

    Ok(TechnicianMetricsResponse {
        total_assigned: total_assigned.0,
        in_progress: in_progress.0,
        resolved_tickets: resolved.0,
        sla_breached,
        sla_at_risk,
    })
}

#[tauri::command]
pub async fn get_requester_metrics(
    user_id: String,
    db: State<'_, SqlitePool>,
) -> Result<RequesterMetricsResponse, AppError> {
    let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM tickets WHERE creator_id = ?1")
        .bind(&user_id).fetch_one(db.inner()).await?;

    let in_progress: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM tickets WHERE creator_id = ?1 AND status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD')"
    )
    .bind(&user_id).fetch_one(db.inner()).await?;

    let resolved: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM tickets WHERE creator_id = ?1 AND status IN ('RESOLVED', 'AWAITING_CONFIRMATION', 'CLOSED')"
    )
    .bind(&user_id).fetch_one(db.inner()).await?;

    let sla_breached: i64 = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM tickets WHERE creator_id = ?1 AND due_date IS NOT NULL AND due_date < datetime('now') AND status NOT IN ('RESOLVED', 'CLOSED')"
    )
    .bind(&user_id).fetch_one(db.inner()).await.unwrap_or(0);

    let sla_at_risk: i64 = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM tickets WHERE creator_id = ?1 AND due_date IS NOT NULL AND due_date > datetime('now') AND due_date < datetime('now', '+2 hours') AND status NOT IN ('RESOLVED', 'CLOSED')"
    )
    .bind(&user_id).fetch_one(db.inner()).await.unwrap_or(0);

    Ok(RequesterMetricsResponse {
        total_tickets: total.0,
        in_progress_tickets: in_progress.0,
        resolved_tickets: resolved.0,
        sla_breached,
        sla_at_risk,
    })
}
