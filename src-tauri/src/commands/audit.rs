use tauri::State;
use sqlx::SqlitePool;
use serde::Deserialize;

use crate::errors::AppError;
use crate::models::*;

type AuditRow = (String, String, String, String, Option<String>, Option<String>, String);

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditFilters {
    pub page: Option<i64>,
    pub limit: Option<i64>,
    pub action: Option<String>,
}

async fn enrich_audit_logs(
    pool: &SqlitePool,
    rows: Vec<AuditRow>,
) -> Result<Vec<AuditLogResponse>, AppError> {
    let mut enriched = Vec::new();
    for (id, tid, uid, action, old_value, new_value, created_at) in rows {
        let user: Option<UserBrief> = sqlx::query_as::<_, (String, String, String)>(
            "SELECT id, first_name, last_name FROM users WHERE id = ?1"
        )
        .bind(&uid)
        .fetch_optional(pool)
        .await?
        .map(|(id, first_name, last_name)| UserBrief { id, first_name, last_name });

        let ticket: Option<TicketBrief> = sqlx::query_as::<_, (String, String, String)>(
            "SELECT id, ticket_code, title FROM tickets WHERE id = ?1"
        )
        .bind(&tid)
        .fetch_optional(pool)
        .await?
        .map(|(id, ticket_code, title)| TicketBrief { id, ticket_code, title });

        enriched.push(AuditLogResponse {
            id, ticket_id: tid, user_id: uid, action, old_value, new_value, created_at,
            user, ticket,
        });
    }
    Ok(enriched)
}

#[tauri::command]
pub async fn get_audit_by_ticket(
    ticket_id: String,
    db: State<'_, SqlitePool>,
) -> Result<Vec<AuditLogResponse>, AppError> {
    let logs = sqlx::query_as::<_, AuditRow>(
        "SELECT al.id, al.ticket_id, al.user_id, al.action, al.old_value, al.new_value, al.created_at
         FROM audit_logs al WHERE al.ticket_id = ?1 ORDER BY al.created_at ASC"
    )
    .bind(&ticket_id)
    .fetch_all(db.inner())
    .await?;

    enrich_audit_logs(db.inner(), logs).await
}

#[tauri::command]
pub async fn get_audit_logs(
    filters: Option<AuditFilters>,
    db: State<'_, SqlitePool>,
) -> Result<Vec<AuditLogResponse>, AppError> {
    let f = filters.unwrap_or(AuditFilters {
        page: None, limit: None, action: None,
    });

    let limit = f.limit.unwrap_or(100).clamp(1, 500);
    let page = f.page.unwrap_or(1).max(1);
    let offset = (page - 1) * limit;

    let mut where_clauses: Vec<String> = Vec::new();
    let mut params: Vec<String> = Vec::new();

    if let Some(ref action) = f.action {
        if !action.is_empty() {
            where_clauses.push(format!("al.action = ?{}", params.len() + 1));
            params.push(action.clone());
        }
    }

    let where_sql = if where_clauses.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", where_clauses.join(" AND "))
    };

    let query_sql = format!(
        "SELECT al.id, al.ticket_id, al.user_id, al.action, al.old_value, al.new_value, al.created_at
         FROM audit_logs al {} ORDER BY al.created_at DESC LIMIT ?{} OFFSET ?{}",
        where_sql,
        params.len() + 1,
        params.len() + 2,
    );

    let mut select_query = sqlx::query_as::<_, AuditRow>(&query_sql);
    for p in &params {
        select_query = select_query.bind(p);
    }
    select_query = select_query.bind(limit);
    select_query = select_query.bind(offset);

    let logs = select_query.fetch_all(db.inner()).await?;
    enrich_audit_logs(db.inner(), logs).await
}
