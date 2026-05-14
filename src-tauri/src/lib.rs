// Sentinel Core — Tauri Builder & Lifecycle

pub mod errors;
pub mod models;
pub mod seed;
pub mod commands;
pub mod sla;
pub mod state_machine;

use sqlx::sqlite::SqlitePoolOptions;
use tauri::Manager;
use std::fs;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_dir = app.path().app_data_dir()?;
            fs::create_dir_all(&app_dir)?;

            let db_path = app_dir.join("sentinel_core.db");
            let db_url = format!("sqlite:{}?mode=rwc", db_path.display());

            let pool = tauri::async_runtime::block_on(async {
                let pool = SqlitePoolOptions::new()
                    .max_connections(5)
                    .connect(&db_url)
                    .await
                    .expect("Error crítico: no se pudo conectar a SQLite");

                sqlx::query("PRAGMA journal_mode=WAL;")
                    .execute(&pool)
                    .await
                    .ok();
                sqlx::query("PRAGMA foreign_keys=ON;")
                    .execute(&pool)
                    .await
                    .ok();

                let migrations = include_str!("../migrations/001_init.sql");
                let statements: Vec<&str> = migrations.split(';').collect();

                for statement in statements {
                    let stmt = statement.trim();
                    if !stmt.is_empty() {
                        sqlx::query(stmt)
                            .execute(&pool)
                            .await
                            .expect("Error crítico: Falló la migración de base de datos");
                    }
                }

                if let Err(e) = seed::run_if_empty(&pool).await {
                    eprintln!("Error en el seeding inicial: {}", e);
                }

                pool
            });

            app.manage(pool);

            println!("✅ Sentinel Core (Tauri) inicializado correctamente y DB lista.");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Auth
            commands::auth::login,
            commands::auth::logout,
            commands::auth::register_public,
            commands::auth::get_profile,
            commands::auth::change_password,
            commands::auth::update_profile,
            
            // Tickets
            commands::tickets::create_ticket,
            commands::tickets::get_tickets,
            commands::tickets::get_ticket,
            commands::tickets::update_ticket_status,
            commands::tickets::resolve_ticket,
            commands::tickets::confirm_ticket,
            commands::tickets::get_my_tickets,
            commands::tickets::get_assigned_tickets,
            
            // Assignments
            commands::assignments::assign_technician,
            commands::assignments::reassign_technician,
            commands::assignments::get_workload,
            
            // Categories
            commands::categories::get_categories,
            commands::categories::create_category,
            commands::categories::update_category,
            commands::categories::delete_category,
            
            // Users
            commands::users::get_users,
            commands::users::get_user,
            commands::users::update_user,
            commands::users::deactivate_user,
            
            // Comments
            commands::comments::create_comment,
            commands::comments::get_comments,
            
            // Notifications
            commands::notifications::get_notifications,
            commands::notifications::mark_as_read,
            commands::notifications::mark_all_as_read,
            
            // Metrics
            commands::metrics::get_dashboard_metrics,
            
            // Audit
            commands::audit::get_audit_logs,
            commands::audit::get_audit_by_ticket,
            
            // Backups
            commands::backups::create_backup,
            commands::backups::list_backups,
            commands::backups::restore_backup,
            commands::backups::delete_backup,
            commands::backups::export_backup,
        ])
        .run(tauri::generate_context!())
        .expect("Error crítico al iniciar Sentinel Core");
}
