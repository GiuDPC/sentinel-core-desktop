use tauri::State;
use sqlx::SqlitePool;
use uuid::Uuid;
use serde::Deserialize;

use crate::errors::AppError;
use crate::models::*;
use crate::state_machine::is_valid_transition;
use crate::sla::calculate_due_date;

fn sanitize(input: &str) -> String {
    input
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#x27;")
        .replace('/', "&#x2F;")
}

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

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfirmTicketPayload {
    pub ticket_id: String,
    pub confirmed: bool,
    pub comment: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TicketFilters {
    pub status: Option<String>,
    pub priority: Option<String>,
    pub search: Option<String>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

async fn generate_ticket_code(pool: &SqlitePool) -> Result<String, AppError> {
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM tickets")
        .fetch_one(pool)
        .await?;

    let next_num = count.0 + 1;

    Ok(format!("TKT-{:04}", next_num.min(9999)))
}

pub async fn get_admin_ids(pool: &SqlitePool) -> Result<Vec<String>, AppError> {
    let admins: Vec<(String,)> = sqlx::query_as(
        "SELECT u.id FROM users u INNER JOIN roles r ON r.id = u.role_id WHERE r.name = 'ADMIN' AND u.is_active = 1"
    )
    .fetch_all(pool)
    .await?;
    Ok(admins.into_iter().map(|(id,)| id).collect())
}

pub async fn enrich_ticket(pool: &SqlitePool, ticket: &Ticket) -> Result<TicketListItem, AppError> {
    let creator: Option<UserBrief> = sqlx::query_as::<_, (String, String, String)>(
        "SELECT id, first_name, last_name FROM users WHERE id = ?1"
    )
    .bind(&ticket.creator_id)
    .fetch_optional(pool)
    .await?
    .map(|(id, first_name, last_name)| UserBrief { id, first_name, last_name });

    let category: Option<CategoryBrief> = sqlx::query_as::<_, (i64, String)>(
        "SELECT id, name FROM categories WHERE id = ?1"
    )
    .bind(ticket.category_id)
    .fetch_optional(pool)
    .await?
    .map(|(id, name)| CategoryBrief { id, name });

    let assignments: Vec<TechnicianBrief> = sqlx::query_as::<_, (String, String, String)>(
        "SELECT u.id, u.first_name, u.last_name FROM assignments a
         INNER JOIN users u ON u.id = a.technician_id
         WHERE a.ticket_id = ?1"
    )
    .bind(&ticket.id)
    .fetch_all(pool)
    .await?
    .into_iter()
    .map(|(id, first_name, last_name)| TechnicianBrief {
        technician: UserBrief { id, first_name, last_name },
    })
    .collect();

    Ok(TicketListItem {
        id: ticket.id.clone(),
        ticket_code: ticket.ticket_code.clone(),
        creator_id: ticket.creator_id.clone(),
        category_id: ticket.category_id,
        title: ticket.title.clone(),
        description: ticket.description.clone(),
        location: ticket.location.clone(),
        status: ticket.status.clone(),
        priority: ticket.priority.clone(),
        due_date: ticket.due_date.clone(),
        resolution_note: ticket.resolution_note.clone(),
        resolved_at: ticket.resolved_at.clone(),
        created_at: ticket.created_at.clone(),
        updated_at: ticket.updated_at.clone(),
        creator,
        category,
        assignments,
    })
}

async fn enrich_ticket_detail(pool: &SqlitePool, ticket: &Ticket) -> Result<TicketDetail, AppError> {
    let list_item = enrich_ticket(pool, ticket).await?;

    let comments: Vec<CommentResponse> = sqlx::query_as::<_, (String, String, String, String, i64, String, String)>(
        "SELECT c.id, c.ticket_id, c.user_id, c.content, c.is_internal, c.created_at, c.updated_at
         FROM comments c WHERE c.ticket_id = ?1 ORDER BY c.created_at ASC"
    )
    .bind(&ticket.id)
    .fetch_all(pool)
    .await?
    .into_iter()
    .map(|(id, ticket_id, user_id, content, is_internal, created_at, updated_at)| {
        CommentResponse {
            id, ticket_id, user_id, content, is_internal, created_at, updated_at,
            user: None,
        }
    })
    .collect();

    // Enrich comment users
    let mut enriched_comments = Vec::new();
    for mut c in comments {
        let user: Option<UserBrief> = sqlx::query_as::<_, (String, String, String)>(
            "SELECT id, first_name, last_name FROM users WHERE id = ?1"
        )
        .bind(&c.user_id)
        .fetch_optional(pool)
        .await?
        .map(|(id, first_name, last_name)| UserBrief { id, first_name, last_name });
        c.user = user;
        enriched_comments.push(c);
    }

    let audit_logs: Vec<AuditLogResponse> = sqlx::query_as::<_, (String, String, String, String, Option<String>, Option<String>, String)>(
        "SELECT al.id, al.ticket_id, al.user_id, al.action, al.old_value, al.new_value, al.created_at
         FROM audit_logs al WHERE al.ticket_id = ?1 ORDER BY al.created_at ASC"
    )
    .bind(&ticket.id)
    .fetch_all(pool)
    .await?
    .into_iter()
    .map(|(id, ticket_id, user_id, action, old_value, new_value, created_at)| {
        AuditLogResponse {
            id, ticket_id, user_id, action, old_value, new_value, created_at,
            user: None,
            ticket: Some(TicketBrief {
                id: ticket.id.clone(),
                ticket_code: ticket.ticket_code.clone(),
                title: ticket.title.clone(),
            }),
        }
    })
    .collect();

    // Enrich audit log users
    let mut enriched_logs = Vec::new();
    for mut log in audit_logs {
        let user: Option<UserBrief> = sqlx::query_as::<_, (String, String, String)>(
            "SELECT id, first_name, last_name FROM users WHERE id = ?1"
        )
        .bind(&log.user_id)
        .fetch_optional(pool)
        .await?
        .map(|(id, first_name, last_name)| UserBrief { id, first_name, last_name });
        log.user = user;
        enriched_logs.push(log);
    }

    Ok(TicketDetail {
        id: list_item.id,
        ticket_code: list_item.ticket_code,
        creator_id: list_item.creator_id,
        category_id: list_item.category_id,
        title: list_item.title,
        description: list_item.description,
        location: list_item.location,
        status: list_item.status,
        priority: list_item.priority,
        due_date: list_item.due_date,
        resolution_note: list_item.resolution_note,
        resolved_at: list_item.resolved_at,
        created_at: list_item.created_at,
        updated_at: list_item.updated_at,
        creator: list_item.creator,
        category: list_item.category,
        assignments: list_item.assignments,
        comments: enriched_comments,
        audit_logs: enriched_logs,
    })
}

pub async fn create_audit_log(
    pool: &SqlitePool,
    ticket_id: &str,
    user_id: &str,
    action: &str,
    old_value: Option<&str>,
    new_value: Option<&str>,
) -> Result<(), AppError> {
    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO audit_logs (id, ticket_id, user_id, action, old_value, new_value) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
    )
    .bind(&id)
    .bind(ticket_id)
    .bind(user_id)
    .bind(action)
    .bind(old_value)
    .bind(new_value)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn create_notification(
    pool: &SqlitePool,
    user_id: &str,
    title: &str,
    message: &str,
    notif_type: &str,
    link: Option<&str>,
) -> Result<(), AppError> {
    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO notifications (id, user_id, title, message, type, link) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
    )
    .bind(&id)
    .bind(user_id)
    .bind(title)
    .bind(message)
    .bind(notif_type)
    .bind(link)
    .execute(pool)
    .await?;
    Ok(())
}

#[tauri::command]
pub async fn create_ticket(
    payload: CreateTicketPayload,
    db: State<'_, SqlitePool>,
) -> Result<TicketListItem, AppError> {
    let cat: Category = sqlx::query_as("SELECT * FROM categories WHERE id = ?1")
        .bind(payload.category_id)
        .fetch_optional(db.inner())
        .await?
        .ok_or_else(|| AppError::NotFound("Categoría no encontrada".into()))?;

    let id = Uuid::new_v4().to_string();
    let ticket_code = generate_ticket_code(db.inner()).await?;

    // Sanitize inputs
    let title = sanitize(&payload.title);
    let description = sanitize(&payload.description);
    let location = sanitize(&payload.location);

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
    .bind(&title)
    .bind(&description)
    .bind(&location)
    .bind(&payload.priority)
    .bind(&due_date)
    .execute(db.inner())
    .await?;

    // Audit log
    create_audit_log(
        db.inner(), &id, &payload.creator_id, "TICKET_CREATED",
        None, Some(&format!("OPEN/{}", payload.priority)),
    ).await?;

    // Notify admins of new ticket
    let admin_ids = get_admin_ids(db.inner()).await?;
    for admin_id in &admin_ids {
        create_notification(
            db.inner(), admin_id, "Nuevo ticket creado",
            &format!("Se ha creado el ticket {} por un solicitante", ticket_code),
            "TICKET_STATUS", Some(&format!("/admin/tickets?id={}", id)),
        ).await?;
    }

    // Notify creator
    create_notification(
        db.inner(), &payload.creator_id, "Ticket creado",
        &format!("Tu ticket {} ha sido registrado exitosamente", ticket_code),
        "TICKET_STATUS", Some(&format!("/requester/my-tickets?id={}", id)),
    ).await?;

    let ticket: Ticket = sqlx::query_as("SELECT * FROM tickets WHERE id = ?1")
        .bind(&id)
        .fetch_one(db.inner())
        .await?;

    enrich_ticket(db.inner(), &ticket).await
}

#[tauri::command]
pub async fn get_tickets(
    filters: TicketFilters,
    db: State<'_, SqlitePool>,
) -> Result<PaginatedResponse<TicketListItem>, AppError> {
    let page = filters.page.unwrap_or(1).max(1);
    let limit = filters.limit.unwrap_or(20).max(1).min(100);
    let offset = (page - 1) * limit;

    // Build dynamic WHERE clause
    let mut where_clauses: Vec<String> = Vec::new();
    let mut params: Vec<String> = Vec::new();

    if let Some(ref status) = filters.status {
        if !status.is_empty() {
            where_clauses.push(format!("t.status = ?{}", params.len() + 1));
            params.push(status.clone());
        }
    }
    if let Some(ref priority) = filters.priority {
        if !priority.is_empty() {
            where_clauses.push(format!("t.priority = ?{}", params.len() + 1));
            params.push(priority.clone());
        }
    }

    // Full-text search: multi-term, busca en ticket_code, title, description, location,
    // y también en nombre del creador y del técnico asignado
    if let Some(ref search) = filters.search {
        if !search.is_empty() {
            let terms: Vec<&str> = search.trim().split_whitespace().collect();
            let mut term_conditions: Vec<String> = Vec::new();
            for term in &terms {
                let pattern = format!("%{}%", term);
                // 9 placeholders: ticket_code, title, description, location,
                // first_name(creator), last_name(creator), email(creator),
                // first_name(tech), last_name(tech)
                let search_sql = 
                    "(t.ticket_code LIKE ? OR t.title LIKE ? OR t.description LIKE ? OR t.location LIKE ? \
                     OR EXISTS (SELECT 1 FROM users cr WHERE cr.id = t.creator_id AND (cr.first_name LIKE ? OR cr.last_name LIKE ? OR cr.email LIKE ?)) \
                     OR EXISTS (SELECT 1 FROM assignments a2 INNER JOIN users te ON te.id = a2.technician_id WHERE a2.ticket_id = t.id AND (te.first_name LIKE ? OR te.last_name LIKE ?)))";
                term_conditions.push(search_sql.to_string());
                for _ in 0..9 {
                    params.push(pattern.clone());
                }
            }
            where_clauses.push(format!("({})", term_conditions.join(" AND ")));
        }
    }

    let where_sql = if where_clauses.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", where_clauses.join(" AND "))
    };

    // Count total
    let count_sql = format!("SELECT COUNT(*) FROM tickets t {}", where_sql);
    let mut count_query = sqlx::query_as::<_, (i64,)>(&count_sql);
    for p in &params {
        count_query = count_query.bind(p);
    }
    let total: i64 = count_query.fetch_one(db.inner()).await?.0;

    let total_pages = if total == 0 { 1 } else { (total + limit - 1) / limit };

    // Fetch page
    let query_sql = format!(
        "SELECT t.* FROM tickets t {} ORDER BY t.created_at DESC LIMIT ?{} OFFSET ?{}",
        where_sql,
        params.len() + 1,
        params.len() + 2,
    );

    let mut select_query = sqlx::query_as::<_, Ticket>(&query_sql);
    for p in &params {
        select_query = select_query.bind(p);
    }
    select_query = select_query.bind(limit);
    select_query = select_query.bind(offset);

    let tickets: Vec<Ticket> = select_query.fetch_all(db.inner()).await?;

    let mut enriched = Vec::new();
    for ticket in &tickets {
        enriched.push(enrich_ticket(db.inner(), ticket).await?);
    }

    Ok(PaginatedResponse {
        data: enriched,
        pagination: PaginationInfo { page, total_pages, total },
    })
}

#[tauri::command]
pub async fn get_ticket(id: String, db: State<'_, SqlitePool>) -> Result<TicketDetail, AppError> {
    let ticket: Ticket = sqlx::query_as("SELECT * FROM tickets WHERE id = ?1")
        .bind(&id)
        .fetch_optional(db.inner())
        .await?
        .ok_or_else(|| AppError::NotFound("Ticket no encontrado".into()))?;

    enrich_ticket_detail(db.inner(), &ticket).await
}

#[tauri::command]
pub async fn get_my_tickets(
    user_id: String,
    filters: Option<TicketFilters>,
    db: State<'_, SqlitePool>,
) -> Result<PaginatedResponse<TicketListItem>, AppError> {
    let f = filters.unwrap_or(TicketFilters {
        status: None, priority: None, search: None, page: None, limit: None,
    });
    let page = f.page.unwrap_or(1).max(1);
    let limit = f.limit.unwrap_or(20).max(1).min(100);
    let offset = (page - 1) * limit;

    // Build WHERE clause: creator_id + filters + search
    let mut where_parts: Vec<String> = vec!["t.creator_id = ?".to_string()];
    let mut params: Vec<String> = vec![user_id.clone()];

    if let Some(ref status) = f.status {
        if !status.is_empty() {
            where_parts.push(format!("t.status = ?{}", params.len() + 1));
            params.push(status.clone());
        }
    }
    if let Some(ref priority) = f.priority {
        if !priority.is_empty() {
            where_parts.push(format!("t.priority = ?{}", params.len() + 1));
            params.push(priority.clone());
        }
    }

    if let Some(ref search) = f.search {
        if !search.is_empty() {
            let terms: Vec<&str> = search.trim().split_whitespace().collect();
            let mut term_conditions: Vec<String> = Vec::new();
            for term in &terms {
                let pattern = format!("%{}%", term);
                let search_sql =
                    "(t.ticket_code LIKE ? OR t.title LIKE ? OR t.description LIKE ? OR t.location LIKE ? \
                     OR EXISTS (SELECT 1 FROM assignments a2 INNER JOIN users te ON te.id = a2.technician_id WHERE a2.ticket_id = t.id AND (te.first_name LIKE ? OR te.last_name LIKE ?)))";
                term_conditions.push(search_sql.to_string());
                for _ in 0..6 {
                    params.push(pattern.clone());
                }
            }
            where_parts.push(format!("({})", term_conditions.join(" AND ")));
        }
    }

    let where_sql = where_parts.join(" AND ");

    // Count
    let count_sql = format!("SELECT COUNT(*) FROM tickets t WHERE {}", where_sql);
    let mut count_q = sqlx::query_scalar::<_, i64>(&count_sql);
    for p in &params {
        count_q = count_q.bind(p);
    }
    let total: i64 = count_q.fetch_one(db.inner()).await?;

    // Fetch
    let query_sql = format!(
        "SELECT t.* FROM tickets t WHERE {} ORDER BY t.created_at DESC LIMIT ? OFFSET ?",
        where_sql
    );
    let mut select_q = sqlx::query_as::<_, Ticket>(&query_sql);
    for p in &params {
        select_q = select_q.bind(p);
    }
    select_q = select_q.bind(limit);
    select_q = select_q.bind(offset);
    let tickets: Vec<Ticket> = select_q.fetch_all(db.inner()).await?;

    let total_pages = if total == 0 { 1 } else { (total + limit - 1) / limit };

    let mut enriched = Vec::new();
    for ticket in &tickets {
        enriched.push(enrich_ticket(db.inner(), ticket).await?);
    }

    Ok(PaginatedResponse {
        data: enriched,
        pagination: PaginationInfo { page, total_pages, total },
    })
}

#[tauri::command]
pub async fn get_assigned_tickets(
    technician_id: String,
    filters: Option<TicketFilters>,
    db: State<'_, SqlitePool>,
) -> Result<PaginatedResponse<TicketListItem>, AppError> {
    let f = filters.unwrap_or(TicketFilters {
        status: None, priority: None, search: None, page: None, limit: None,
    });
    let page = f.page.unwrap_or(1).max(1);
    let limit = f.limit.unwrap_or(20).max(1).min(100);
    let offset = (page - 1) * limit;

    // Build WHERE clause: technician_id + filters + search
    let mut where_parts: Vec<String> = vec!["a.technician_id = ?".to_string()];
    let mut params: Vec<String> = vec![technician_id.clone()];

    if let Some(ref status) = f.status {
        if !status.is_empty() {
            where_parts.push(format!("t.status = ?{}", params.len() + 1));
            params.push(status.clone());
        }
    }
    if let Some(ref priority) = f.priority {
        if !priority.is_empty() {
            where_parts.push(format!("t.priority = ?{}", params.len() + 1));
            params.push(priority.clone());
        }
    }

    if let Some(ref search) = f.search {
        if !search.is_empty() {
            let terms: Vec<&str> = search.trim().split_whitespace().collect();
            let mut term_conditions: Vec<String> = Vec::new();
            for term in &terms {
                let pattern = format!("%{}%", term);
                let search_sql =
                    "(t.ticket_code LIKE ? OR t.title LIKE ? OR t.description LIKE ? OR t.location LIKE ? \
                     OR EXISTS (SELECT 1 FROM users cr WHERE cr.id = t.creator_id AND (cr.first_name LIKE ? OR cr.last_name LIKE ? OR cr.email LIKE ?)))";
                term_conditions.push(search_sql.to_string());
                for _ in 0..7 {
                    params.push(pattern.clone());
                }
            }
            where_parts.push(format!("({})", term_conditions.join(" AND ")));
        }
    }

    let where_sql = where_parts.join(" AND ");

    // Count
    let count_sql = format!(
        "SELECT COUNT(*) FROM tickets t INNER JOIN assignments a ON t.id = a.ticket_id WHERE {}",
        where_sql
    );
    let mut count_q = sqlx::query_scalar::<_, i64>(&count_sql);
    for p in &params {
        count_q = count_q.bind(p);
    }
    let total: i64 = count_q.fetch_one(db.inner()).await?;

    let total_pages = if total == 0 { 1 } else { (total + limit - 1) / limit };

    // Fetch
    let query_sql = format!(
        "SELECT t.* FROM tickets t INNER JOIN assignments a ON t.id = a.ticket_id WHERE {} ORDER BY t.created_at DESC LIMIT ? OFFSET ?",
        where_sql
    );
    let mut select_q = sqlx::query_as::<_, Ticket>(&query_sql);
    for p in &params {
        select_q = select_q.bind(p);
    }
    select_q = select_q.bind(limit);
    select_q = select_q.bind(offset);
    let tickets: Vec<Ticket> = select_q.fetch_all(db.inner()).await?;

    let mut enriched = Vec::new();
    for ticket in &tickets {
        enriched.push(enrich_ticket(db.inner(), ticket).await?);
    }

    Ok(PaginatedResponse {
        data: enriched,
        pagination: PaginationInfo { page, total_pages, total },
    })
}

#[tauri::command]
pub async fn update_ticket_status(
    payload: UpdateStatusPayload,
    user_id: String,
    db: State<'_, SqlitePool>,
) -> Result<TicketDetail, AppError> {
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

    let old_status = current_ticket.status.clone();

    sqlx::query("UPDATE tickets SET status = ?1, updated_at = datetime('now') WHERE id = ?2")
        .bind(&payload.status)
        .bind(&payload.ticket_id)
        .execute(db.inner())
        .await?;

    // Audit log
    create_audit_log(
        db.inner(), &payload.ticket_id, &user_id, "STATUS_CHANGE",
        Some(&old_status), Some(&payload.status),
    ).await?;

    // Notify creator of status change
    let creator_id: (String,) = sqlx::query_as("SELECT creator_id FROM tickets WHERE id = ?1")
        .bind(&payload.ticket_id)
        .fetch_one(db.inner())
        .await?;
    create_notification(
        db.inner(), &creator_id.0, "Estado actualizado",
        &format!("El ticket {} cambió de {} a {}", current_ticket.ticket_code, old_status, payload.status),
        "TICKET_STATUS", Some(&format!("/requester/my-tickets?id={}", payload.ticket_id)),
    ).await?;

    let updated: Ticket = sqlx::query_as("SELECT * FROM tickets WHERE id = ?1")
        .bind(&payload.ticket_id)
        .fetch_one(db.inner())
        .await?;

    enrich_ticket_detail(db.inner(), &updated).await
}

#[tauri::command]
pub async fn resolve_ticket(
    payload: ResolveTicketPayload,
    user_id: String,
    db: State<'_, SqlitePool>,
) -> Result<TicketDetail, AppError> {
    let current_ticket: Ticket = sqlx::query_as("SELECT * FROM tickets WHERE id = ?1")
        .bind(&payload.ticket_id)
        .fetch_optional(db.inner())
        .await?
        .ok_or_else(|| AppError::NotFound("Ticket no encontrado".into()))?;

    if !is_valid_transition(&current_ticket.status, "AWAITING_CONFIRMATION") {
        return Err(AppError::Validation("El ticket no puede ser resuelto desde este estado".into()));
    }

    sqlx::query("UPDATE tickets SET status = 'AWAITING_CONFIRMATION', resolution_note = ?1, resolved_at = datetime('now'), updated_at = datetime('now') WHERE id = ?2")
        .bind(&payload.resolution_note)
        .bind(&payload.ticket_id)
        .execute(db.inner())
        .await?;

    // Audit log
    create_audit_log(
        db.inner(), &payload.ticket_id, &user_id, "RESOLUTION_NOTE",
        Some(&current_ticket.status), Some("AWAITING_CONFIRMATION"),
    ).await?;

    // Notify requester
    let creator_id: (String,) = sqlx::query_as("SELECT creator_id FROM tickets WHERE id = ?1")
        .bind(&payload.ticket_id)
        .fetch_one(db.inner())
        .await?;
    create_notification(
        db.inner(), &creator_id.0, "Ticket resuelto",
        &format!("El ticket {} está listo para tu confirmación.", current_ticket.ticket_code),
        "TICKET_STATUS", Some(&format!("/requester/my-tickets?ticketId={}", payload.ticket_id)),
    ).await?;

    let updated: Ticket = sqlx::query_as("SELECT * FROM tickets WHERE id = ?1")
        .bind(&payload.ticket_id)
        .fetch_one(db.inner())
        .await?;

    enrich_ticket_detail(db.inner(), &updated).await
}

#[tauri::command]
pub async fn confirm_ticket(
    payload: ConfirmTicketPayload,
    user_id: String,
    db: State<'_, SqlitePool>,
) -> Result<TicketDetail, AppError> {
    let current_ticket: Ticket = sqlx::query_as("SELECT * FROM tickets WHERE id = ?1")
        .bind(&payload.ticket_id)
        .fetch_optional(db.inner())
        .await?
        .ok_or_else(|| AppError::NotFound("Ticket no encontrado".into()))?;

    // Validar que está en estado de confirmación
    if current_ticket.status != "AWAITING_CONFIRMATION" && current_ticket.status != "RESOLVED" {
        return Err(AppError::Validation("El ticket no está esperando confirmación".into()));
    }

    // Verificar que solo el creador puede confirmar
    if current_ticket.creator_id != user_id {
        return Err(AppError::Auth("Solo el creador del ticket puede confirmar o rechazar".into()));
    }

    if payload.confirmed {
        // CONFIRMAR: CLOSED
        sqlx::query("UPDATE tickets SET status = 'CLOSED', updated_at = datetime('now') WHERE id = ?1")
            .bind(&payload.ticket_id)
            .execute(db.inner())
            .await?;

        create_audit_log(
            db.inner(), &payload.ticket_id, &user_id, "TICKET_CONFIRMED",
            Some(&current_ticket.status), Some("CLOSED"),
        ).await?;

        // Notify technicians assigned
        let tech_ids: Vec<(String,)> = sqlx::query_as(
            "SELECT technician_id FROM assignments WHERE ticket_id = ?1"
        )
        .bind(&payload.ticket_id)
        .fetch_all(db.inner())
        .await?;
        for (tid,) in &tech_ids {
            create_notification(
                db.inner(), tid, "Ticket confirmado",
                &format!("El ticket {} ha sido confirmado por el solicitante", current_ticket.ticket_code),
                "TICKET_STATUS", Some(&format!("/technician/ticket/{}", payload.ticket_id)),
            ).await?;
        }
    } else {
        // RECHAZAR / REABRIR: IN_PROGRESS (limpia resolución)
        sqlx::query(
            "UPDATE tickets SET status = 'IN_PROGRESS', resolution_note = NULL, resolved_at = NULL, updated_at = datetime('now') WHERE id = ?1"
        )
        .bind(&payload.ticket_id)
        .execute(db.inner())
        .await?;

        create_audit_log(
            db.inner(), &payload.ticket_id, &user_id, "TICKET_REOPENED",
            Some(&current_ticket.status), Some("IN_PROGRESS"),
        ).await?;

        // Si hay comentario de rechazo, crearlo
        if let Some(ref comment_text) = payload.comment {
            if !comment_text.trim().is_empty() {
                let comment_id = Uuid::new_v4().to_string();
                let sanitized = sanitize(comment_text);
                sqlx::query(
                    "INSERT INTO comments (id, ticket_id, user_id, content, is_internal) VALUES (?, ?, ?, ?, 0)"
                )
                .bind(&comment_id)
                .bind(&payload.ticket_id)
                .bind(&user_id)
                .bind(&sanitized)
                .execute(db.inner())
                .await?;
            }
        }

        // Notify technicians
        let tech_ids: Vec<(String,)> = sqlx::query_as(
            "SELECT technician_id FROM assignments WHERE ticket_id = ?1"
        )
        .bind(&payload.ticket_id)
        .fetch_all(db.inner())
        .await?;
        for (tid,) in &tech_ids {
            create_notification(
                db.inner(), tid, "Ticket reabierto",
                &format!("El ticket {} ha sido reabierto por el solicitante", current_ticket.ticket_code),
                "TICKET_STATUS", Some(&format!("/technician/ticket/{}", payload.ticket_id)),
            ).await?;
        }
    }

    let updated: Ticket = sqlx::query_as("SELECT * FROM tickets WHERE id = ?1")
        .bind(&payload.ticket_id)
        .fetch_one(db.inner())
        .await?;

    enrich_ticket_detail(db.inner(), &updated).await
}
