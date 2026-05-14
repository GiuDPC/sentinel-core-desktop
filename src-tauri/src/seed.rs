use sqlx::SqlitePool;
use uuid::Uuid;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
    Argon2,
};
use tokio::task;
use rand::Rng;
use crate::errors::AppError;

pub async fn run_if_empty(pool: &SqlitePool) -> Result<(), AppError> {
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(pool)
        .await
        .unwrap_or((0,));

    if count.0 == 0 {
        println!("Base de datos vacía. Ejecutando seed completo (Fase D)...");

        // 1. Roles (ADMIN, TECHNICIAN, REQUESTER)
        let roles = [
            (1, "ADMIN", "Administrador del sistema"),
            (2, "TECHNICIAN", "Técnico de soporte"),
            (3, "REQUESTER", "Locatario / Solicitante"),
        ];
        for (id, name, desc) in roles.iter() {
            sqlx::query("INSERT INTO roles (id, name, description) VALUES (?, ?, ?)")
                .bind(id).bind(name).bind(desc)
                .execute(pool).await?;
        }

        // 2. 8 Categorías con SLA
        let categories = [
            ("Mantenimiento Eléctrico", "MANTENIMIENTO", 24),
            ("Soporte Técnico IT", "SISTEMAS", 12),
            ("Plomería", "MANTENIMIENTO", 24),
            ("Seguridad Física", "SEGURIDAD", 6),
            ("Limpieza y Aseo", "SERVICIOS", 48),
            ("Aire Acondicionado", "MANTENIMIENTO", 24),
            ("Redes y Comunicaciones", "SISTEMAS", 8),
            ("Mobiliario", "SERVICIOS", 72),
        ];
        for (name, dep, sla) in categories.iter() {
            sqlx::query("INSERT INTO categories (name, department, sla_hours) VALUES (?, ?, ?)")
                .bind(name).bind(dep).bind(sla)
                .execute(pool).await?;
        }

        // Hashing de contraseñas requeridas
        let admin_hash = hash_password("SentinelAdmin2026!").await?;
        let tech_hash = hash_password("Tecnico2026!").await?;
        let req_hash = hash_password("Locatario2026!").await?;

        // 3. Crear 2 Admins
        let admins = [
            ("admin@sentinel.local", "Admin", "Sistema"),
            ("admin.secundario@sentinel.local", "Admin2", "Respaldo"),
        ];
        let mut admin_ids = vec![];
        for (email, fname, lname) in admins.iter() {
            let id = Uuid::new_v4().to_string();
            admin_ids.push(id.clone());
            sqlx::query("INSERT INTO users (id, role_id, first_name, last_name, email, password_hash, department, is_active) VALUES (?, 1, ?, ?, ?, ?, 'SISTEMAS', 1)")
                .bind(&id).bind(fname).bind(lname).bind(email).bind(&admin_hash)
                .execute(pool).await?;
        }

        // 4. Crear 5 Técnicos
        let techs = [
            ("carlos.perez@sentinel.local", "Carlos", "Perez", "MANTENIMIENTO"),
            ("luis.gomez@sentinel.local", "Luis", "Gomez", "SISTEMAS"),
            ("maria.lopez@sentinel.local", "Maria", "Lopez", "SERVICIOS"),
            ("juan.diaz@sentinel.local", "Juan", "Diaz", "MANTENIMIENTO"),
            ("pedro.ruiz@sentinel.local", "Pedro", "Ruiz", "SEGURIDAD"),
        ];
        let mut tech_ids = vec![];
        for (email, fname, lname, dep) in techs.iter() {
            let id = Uuid::new_v4().to_string();
            tech_ids.push(id.clone());
            sqlx::query("INSERT INTO users (id, role_id, first_name, last_name, email, password_hash, department, is_active) VALUES (?, 2, ?, ?, ?, ?, ?, 1)")
                .bind(&id).bind(fname).bind(lname).bind(email).bind(&tech_hash).bind(dep)
                .execute(pool).await?;
        }

        // 5. Crear 8 Locatarios (Requesters)
        let requesters = [
            ("ana.martinez@sentinel.local", "Ana", "Martinez", "L-101", "Tienda Ana"),
            ("roberto.sanchez@sentinel.local", "Roberto", "Sanchez", "L-102", "Moda Roberto"),
            ("lucia.fernandez@sentinel.local", "Lucia", "Fernandez", "L-103", "Tech Lucia"),
            ("carmen.torres@sentinel.local", "Carmen", "Torres", "L-104", "Zapatos Carmen"),
            ("jorge.ramirez@sentinel.local", "Jorge", "Ramirez", "L-105", "Deportes Jorge"),
            ("sofia.vargas@sentinel.local", "Sofia", "Vargas", "L-106", "Joyas Sofia"),
            ("miguel.castro@sentinel.local", "Miguel", "Castro", "L-107", "Libros Miguel"),
            ("elena.mendoza@sentinel.local", "Elena", "Mendoza", "L-108", "Café Elena"),
        ];
        let mut req_ids = vec![];
        for (email, fname, lname, store_num, store_name) in requesters.iter() {
            let id = Uuid::new_v4().to_string();
            req_ids.push(id.clone());
            sqlx::query("INSERT INTO users (id, role_id, first_name, last_name, email, password_hash, store_number, store_name, is_active) VALUES (?, 3, ?, ?, ?, ?, ?, ?, 1)")
                .bind(&id).bind(fname).bind(lname).bind(email).bind(&req_hash).bind(store_num).bind(store_name)
                .execute(pool).await?;
        }

        // 6. Crear 35 Tickets
        let statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
        let mut rng = rand::thread_rng();

        for i in 1..=35 {
            let id = Uuid::new_v4().to_string();
            let req_id = &req_ids[rng.gen_range(0..req_ids.len())];
            let cat_id = rng.gen_range(1..=8); // 8 categorías generadas en orden 1..8
            let status = statuses[rng.gen_range(0..statuses.len())];
            
            let assigned_to = if status != "OPEN" { Some(&tech_ids[rng.gen_range(0..tech_ids.len())]) } else { None };
            let title = format!("Ticket de prueba {}", i);
            let description = format!("Descripción detallada para el ticket de prueba número {}. Se requiere atención según el SLA establecido.", i);
            let ticket_code = format!("TCK-2026-{:04}", i);
            let location = format!("Local L-{:03}", rng.gen_range(100..200));

            sqlx::query("INSERT INTO tickets (id, ticket_code, creator_id, category_id, title, description, location, status, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'MEDIUM')")
                .bind(&id).bind(&ticket_code).bind(req_id).bind(cat_id).bind(&title).bind(&description).bind(&location).bind(status)
                .execute(pool).await?;

            if let Some(tech_id) = assigned_to {
                sqlx::query("INSERT INTO assignments (ticket_id, technician_id) VALUES (?, ?)")
                    .bind(&id).bind(tech_id)
                    .execute(pool).await?;
            }
        }

        println!("✅ Seed de 35 tickets y usuarios completado con éxito.");
    }
    
    Ok(())
}

async fn hash_password(password: &str) -> Result<String, AppError> {
    let password = password.to_string();
    task::spawn_blocking(move || {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        argon2.hash_password(password.as_bytes(), &salt).map(|h| h.to_string())
    }).await.map_err(|e| AppError::Internal(e.to_string()))?
    .map_err(|e| AppError::Internal(e.to_string()))
}
