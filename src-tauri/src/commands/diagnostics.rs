use tauri::State;
use tauri::AppHandle;
use tauri::Manager;
use sqlx::SqlitePool;
use serde::Serialize;
use std::fs;

use crate::errors::AppError;
use crate::seed;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DbStatus {
    pub user_count: i64,
    pub ticket_count: i64,
    pub category_count: i64,
    pub assignment_count: i64,
    pub comment_count: i64,
    pub notification_count: i64,
    pub audit_log_count: i64,
    pub status: String,
}

#[tauri::command]
pub async fn check_db_status(db: State<'_, SqlitePool>) -> Result<DbStatus, AppError> {
    let user_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(db.inner()).await.unwrap_or((0,));
    let ticket_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM tickets")
        .fetch_one(db.inner()).await.unwrap_or((0,));
    let category_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM categories")
        .fetch_one(db.inner()).await.unwrap_or((0,));
    let assignment_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM assignments")
        .fetch_one(db.inner()).await.unwrap_or((0,));
    let comment_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM comments")
        .fetch_one(db.inner()).await.unwrap_or((0,));
    let notification_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM notifications")
        .fetch_one(db.inner()).await.unwrap_or((0,));
    let audit_log_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM audit_logs")
        .fetch_one(db.inner()).await.unwrap_or((0,));

    let status = if ticket_count.0 > 0 { "OK" } else { "VACÍA" };

    Ok(DbStatus {
        user_count: user_count.0,
        ticket_count: ticket_count.0,
        category_count: category_count.0,
        assignment_count: assignment_count.0,
        comment_count: comment_count.0,
        notification_count: notification_count.0,
        audit_log_count: audit_log_count.0,
        status: status.into(),
    })
}

#[tauri::command]
pub async fn reset_database(
    app: AppHandle,
    db: State<'_, SqlitePool>,
) -> Result<DbStatus, AppError> {
    // 1. Backup automático antes de resetear
    let app_dir = app.path().app_data_dir().map_err(|e| AppError::Internal(e.to_string()))?;
    let db_path = app_dir.join("sentinel_core.db");
    let backup_dir = app_dir.join("backups");
    fs::create_dir_all(&backup_dir).map_err(|e| AppError::Internal(e.to_string()))?;
    let backup_filename = format!("pre_reset_{}.db", chrono::Utc::now().format("%Y%m%d_%H%M%S"));
    let backup_path = backup_dir.join(&backup_filename);
    if db_path.exists() {
        fs::copy(&db_path, &backup_path).map_err(|e| AppError::Internal(e.to_string()))?;
    }

    // Drop en orden inverso por FK
    let tables = [
        "audit_logs", "notifications", "comments", "assignments",
        "tickets", "categories", "users", "roles",
    ];
    for table in &tables {
        sqlx::query("PRAGMA foreign_keys=OFF").execute(db.inner()).await.ok();
        sqlx::query(&format!("DROP TABLE IF EXISTS {}", table))
            .execute(db.inner())
            .await?;
        sqlx::query("PRAGMA foreign_keys=ON").execute(db.inner()).await.ok();
    }

    // 3. Re-ejecutar migración
    let migrations = include_str!("../../migrations/001_init.sql");
    for statement in migrations.split(';') {
        let stmt = statement.trim();
        if !stmt.is_empty() {
            sqlx::query(stmt).execute(db.inner()).await?;
        }
    }

    // 4. Re-ejecutar seed
    seed::run_if_empty(db.inner()).await?;

    let status = check_db_status_inner(db.inner()).await;
    Ok(status)
}

async fn check_db_status_inner(pool: &SqlitePool) -> DbStatus {
    let user_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(pool).await.unwrap_or((0,));
    let ticket_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM tickets")
        .fetch_one(pool).await.unwrap_or((0,));
    let category_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM categories")
        .fetch_one(pool).await.unwrap_or((0,));
    let assignment_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM assignments")
        .fetch_one(pool).await.unwrap_or((0,));
    let comment_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM comments")
        .fetch_one(pool).await.unwrap_or((0,));
    let notification_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM notifications")
        .fetch_one(pool).await.unwrap_or((0,));
    let audit_log_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM audit_logs")
        .fetch_one(pool).await.unwrap_or((0,));

    let status = if ticket_count.0 > 0 { "OK" } else { "VACÍA" };

    DbStatus {
        user_count: user_count.0,
        ticket_count: ticket_count.0,
        category_count: category_count.0,
        assignment_count: assignment_count.0,
        comment_count: comment_count.0,
        notification_count: notification_count.0,
        audit_log_count: audit_log_count.0,
        status: status.into(),
    }
}
