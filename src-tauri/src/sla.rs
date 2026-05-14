use chrono::{Duration, NaiveDateTime, Utc};

// Calculadora de SLA
// SQLite maneja las fechas nativas de datetime('now') en formato "YYYY-MM-DD HH:MM:SS"
pub fn calculate_due_date(created_at: &str, sla_hours: i64) -> Option<String> {
    let dt = NaiveDateTime::parse_from_str(created_at, "%Y-%m-%d %H:%M:%S").ok()?;
    let due = dt + Duration::hours(sla_hours);
    Some(due.format("%Y-%m-%d %H:%M:%S").to_string())
}

pub fn is_sla_breached(due_date: Option<&str>) -> bool {
    if let Some(due) = due_date {
        if let Ok(dt) = NaiveDateTime::parse_from_str(due, "%Y-%m-%d %H:%M:%S") {
            return Utc::now().naive_utc() > dt;
        }
    }
    false
}
