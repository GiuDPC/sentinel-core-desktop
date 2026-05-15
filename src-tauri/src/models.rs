use serde::{Deserialize, Serialize};
use sqlx::FromRow;

// ─── Modelos base (FromRow para queries SQL directas) ───

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Role {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: String,
    pub role_id: i64,
    pub first_name: String,
    pub last_name: String,
    pub email: String,
    pub password_hash: String,
    pub phone: Option<String>,
    pub department: Option<String>,
    pub store_number: Option<String>,
    pub store_name: Option<String>,
    pub is_active: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserResponse {
    pub id: String,
    pub role_id: i64,
    pub role: String,
    pub first_name: String,
    pub last_name: String,
    pub email: String,
    pub phone: Option<String>,
    pub department: Option<String>,
    pub store_number: Option<String>,
    pub store_name: Option<String>,
    pub is_active: i64,
    pub created_at: String,
    pub updated_at: String,
}

impl User {
    /// Obtiene el nombre del rol desde la base de datos
    pub async fn get_role_name(pool: &sqlx::SqlitePool, role_id: i64) -> String {
        let result: Result<(String,), sqlx::Error> = sqlx::query_as(
            "SELECT name FROM roles WHERE id = ?1"
        )
        .bind(role_id)
        .fetch_one(pool)
        .await;
        result.map(|r| r.0).unwrap_or_else(|_| "REQUESTER".to_string())
    }
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        // Default role — will be overwritten by login/me after querying
        let role = match user.role_id {
            1 => "ADMIN".to_string(),
            2 => "TECHNICIAN".to_string(),
            _ => "REQUESTER".to_string(),
        };
        UserResponse {
            id: user.id,
            role_id: user.role_id,
            role,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone: user.phone,
            department: user.department,
            store_number: user.store_number,
            store_name: user.store_name,
            is_active: user.is_active,
            created_at: user.created_at,
            updated_at: user.updated_at,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub department: String,
    pub sla_hours: i64,
    pub is_active: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Ticket {
    pub id: String,
    pub ticket_code: String,
    pub creator_id: String,
    pub category_id: i64,
    pub title: String,
    pub description: String,
    pub location: String,
    pub status: String,
    pub priority: String,
    pub due_date: Option<String>,
    pub resolution_note: Option<String>,
    pub resolved_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

// ─── Tipos de respuesta anidados para el frontend ───

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserBrief {
    pub id: String,
    pub first_name: String,
    pub last_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryBrief {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TechnicianBrief {
    pub technician: UserBrief,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TicketListItem {
    pub id: String,
    pub ticket_code: String,
    pub creator_id: String,
    pub category_id: i64,
    pub title: String,
    pub description: String,
    pub location: String,
    pub status: String,
    pub priority: String,
    pub due_date: Option<String>,
    pub resolution_note: Option<String>,
    pub resolved_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub creator: Option<UserBrief>,
    pub category: Option<CategoryBrief>,
    pub assignments: Vec<TechnicianBrief>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommentResponse {
    pub id: String,
    pub ticket_id: String,
    pub user_id: String,
    pub content: String,
    pub is_internal: i64,
    pub created_at: String,
    pub updated_at: String,
    pub user: Option<UserBrief>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditLogResponse {
    pub id: String,
    pub ticket_id: String,
    pub user_id: String,
    pub action: String,
    pub old_value: Option<String>,
    pub new_value: Option<String>,
    pub created_at: String,
    pub user: Option<UserBrief>,
    pub ticket: Option<TicketBrief>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TicketBrief {
    pub id: String,
    pub ticket_code: String,
    pub title: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TicketDetail {
    pub id: String,
    pub ticket_code: String,
    pub creator_id: String,
    pub category_id: i64,
    pub title: String,
    pub description: String,
    pub location: String,
    pub status: String,
    pub priority: String,
    pub due_date: Option<String>,
    pub resolution_note: Option<String>,
    pub resolved_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub creator: Option<UserBrief>,
    pub category: Option<CategoryBrief>,
    pub assignments: Vec<TechnicianBrief>,
    pub comments: Vec<CommentResponse>,
    pub audit_logs: Vec<AuditLogResponse>,
}

// ─── Payloads de paginación y listas ───

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginatedResponse<T: Serialize> {
    pub data: Vec<T>,
    pub pagination: PaginationInfo,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginationInfo {
    pub page: i64,
    pub total_pages: i64,
    pub total: i64,
}

// ─── Métricas ───

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardMetricsResponse {
    pub summary: MetricsSummary,
    pub tickets_by_category: Vec<CategoryCount>,
    pub tickets_by_status: Vec<StatusCount>,
    pub tickets_by_priority: Vec<PriorityCount>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetricsSummary {
    pub total_tickets: i64,
    pub open_tickets: i64,
    pub assigned_tickets: i64,
    pub in_progress_tickets: i64,
    pub resolved_tickets: i64,
    pub closed_tickets: i64,
    pub sla_breached: i64,
    pub sla_at_risk: i64,
    pub avg_resolution_hours: f64,
    pub tickets_this_month: i64,
    pub trend_percentage: f64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryCount {
    pub category: String,
    pub count: i64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatusCount {
    pub status: String,
    pub count: i64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PriorityCount {
    pub priority: String,
    pub count: i64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TechnicianMetricsResponse {
    pub total_assigned: i64,
    pub in_progress: i64,
    pub resolved_tickets: i64,
    pub sla_breached: i64,
    pub sla_at_risk: i64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RequesterMetricsResponse {
    pub total_tickets: i64,
    pub in_progress_tickets: i64,
    pub resolved_tickets: i64,
    pub sla_breached: i64,
    pub sla_at_risk: i64,
}

// ─── Carga de trabajo ───

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkloadTechInfo {
    pub id: String,
    pub first_name: String,
    pub last_name: String,
    pub department: Option<String>,
    pub active_tickets: i64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkloadResponse {
    pub technicians: Vec<WorkloadTechInfo>,
    pub suggested: Option<String>,
}
