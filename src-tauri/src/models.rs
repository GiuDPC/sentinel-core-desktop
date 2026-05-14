use serde::{Deserialize, Serialize};
use sqlx::FromRow;

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
    pub is_active: i64, // SQLite booleans are 0 or 1
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserResponse {
    pub id: String,
    pub role_id: i64,
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

// Conversión segura de User a UserResponse (quitando el password_hash)
impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        UserResponse {
            id: user.id,
            role_id: user.role_id,
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
