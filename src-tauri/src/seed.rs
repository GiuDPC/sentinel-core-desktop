use sqlx::SqlitePool;
use uuid::Uuid;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
    Argon2,
};
use tokio::task;
use crate::errors::AppError;

pub async fn run_if_empty(pool: &SqlitePool) -> Result<(), AppError> {
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(pool)
        .await?;

    if count.0 == 0 {
        println!("Base de datos vacia. Ejecutando seed completo...");

        // 1. Roles
        let roles = [
            (1, "ADMIN", "Administrador del centro comercial"),
            (2, "TECHNICIAN", "Tecnico de mantenimiento"),
            (3, "REQUESTER", "Locatario del centro comercial"),
        ];
        for (id, name, desc) in roles.iter() {
            let _ = sqlx::query("INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)")
                .bind(id).bind(name).bind(desc)
                .execute(pool).await;
        }

        // 2. Categorias
        let cats_data = [
            ("Corte Electrico", "MANTENIMIENTO_ELECTRICO", 4),
            ("Fuga de Agua", "PLOMERIA", 6),
            ("Falla de Red / Internet", "REDES_Y_TELECOMUNICACIONES", 8),
            ("Infraestructura Fisica", "INFRAESTRUCTURA", 24),
            ("Incendio / Emergencia", "SEGURIDAD", 1),
            ("Sistema de Seguridad", "SEGURIDAD", 2),
            ("Aire Acondicionado", "OTROS", 12),
            ("Limpieza General", "OTROS", 4),
        ];
        for (name, dept, sla) in cats_data.iter() {
            sqlx::query("INSERT INTO categories (name, department, sla_hours) VALUES (?, ?, ?)")
                .bind(name).bind(dept).bind(sla)
                .execute(pool).await?;
        }

        // 3. Passwords
        let admin_hash = hash_password("SentinelAdmin2026!").await?;
        let tech_hash = hash_password("Tecnico2026!").await?;
        let req_hash = hash_password("Locatario2026!").await?;

        // 4. Admins
        let admin_id = Uuid::new_v4().to_string();
        sqlx::query("INSERT INTO users (id, role_id, first_name, last_name, email, password_hash, department, is_active) VALUES (?, 1, ?, ?, ?, ?, 'ADMINISTRACION', 1)")
            .bind(&admin_id).bind("Giuseppe").bind("Admin").bind("admin@sentinel.local").bind(&admin_hash)
            .execute(pool).await?;

        let admin2_id = Uuid::new_v4().to_string();
        sqlx::query("INSERT INTO users (id, role_id, first_name, last_name, email, password_hash, department, is_active) VALUES (?, 1, ?, ?, ?, ?, 'ADMINISTRACION', 1)")
            .bind(&admin2_id).bind("Director").bind("Operaciones").bind("director@sentinel.local").bind(&admin_hash)
            .execute(pool).await?;

        // 5. Tecnicos
        let techs_data = [
            ("Carlos", "Perez", "carlos.perez@sentinel.local", "MANTENIMIENTO_ELECTRICO", "0412-1234567"),
            ("Maria", "Lopez", "maria.lopez@sentinel.local", "PLOMERIA", "0414-7654321"),
            ("Pedro", "Ramirez", "pedro.ramirez@sentinel.local", "REDES_Y_TELECOMUNICACIONES", "0424-9876543"),
            ("Luis", "Fernandez", "luis.fernandez@sentinel.local", "INFRAESTRUCTURA", "0416-5551234"),
            ("Andrea", "Gutierrez", "andrea.gutierrez@sentinel.local", "OTROS", "0426-3334567"),
        ];
        let mut tech_ids: Vec<String> = Vec::new();
        for (fname, lname, email, dept, phone) in techs_data.iter() {
            let id = Uuid::new_v4().to_string();
            tech_ids.push(id.clone());
            sqlx::query("INSERT INTO users (id, role_id, first_name, last_name, email, password_hash, phone, department, is_active) VALUES (?, 2, ?, ?, ?, ?, ?, ?, 1)")
                .bind(&id).bind(fname).bind(lname).bind(email).bind(&tech_hash).bind(phone).bind(dept)
                .execute(pool).await?;
        }

        // 6. Locatarios
        let reqs_data = [
            ("Juan", "Garcia", "juan.garcia@sentinel.local", "L-105", "Tienda JG Fashion"),
            ("Ana", "Martinez", "ana.martinez@sentinel.local", "L-210", "Cafe Martinez"),
            ("Roberto", "Diaz", "roberto.diaz@sentinel.local", "L-302", "Electronica Diaz"),
            ("Carmen", "Hernandez", "carmen.hernandez@sentinel.local", "L-118", "Pasteleria Dulce Carmen"),
            ("Sofia", "Morales", "sofia.morales@sentinel.local", "L-450", "Boutique Sofia"),
            ("Diego", "Torres", "diego.torres@sentinel.local", "L-515", "Sports Zone"),
            ("Valentina", "Rivas", "valentina.rivas@sentinel.local", "L-330", "Optica Rivas"),
            ("Miguel", "Castillo", "miguel.castillo@sentinel.local", "L-401", "Tech Hub"),
        ];
        let mut req_ids: Vec<String> = Vec::new();
        for (fname, lname, email, store_num, store_name) in reqs_data.iter() {
            let id = Uuid::new_v4().to_string();
            req_ids.push(id.clone());
            sqlx::query("INSERT INTO users (id, role_id, first_name, last_name, email, password_hash, store_number, store_name, is_active) VALUES (?, 3, ?, ?, ?, ?, ?, ?, 1)")
                .bind(&id).bind(fname).bind(lname).bind(email).bind(&req_hash).bind(store_num).bind(store_name)
                .execute(pool).await?;
        }

        // 7. Tickets
        struct TicketDef {
            title: &'static str,
            desc: &'static str,
            loc: &'static str,
            cat: usize,
            pri: &'static str,
            status: &'static str,
            cr: usize,
            tech: Option<usize>,
            days: i64,
            slah: i64,
            note: Option<&'static str>,
        }

        let defs = vec![
            // OPEN (6)
            TicketDef { title: "Apagon parcial en local L-105", desc: "Se fue la luz en la mitad del local", loc: "Local L-105, Nivel 1", cat: 0, pri: "HIGH", status: "OPEN", cr: 0, tech: None, days: 0, slah: 4, note: None },
            TicketDef { title: "Filtracion de agua en techo", desc: "Goteo constante desde el techo", loc: "Local L-210, Nivel 2", cat: 1, pri: "MEDIUM", status: "OPEN", cr: 1, tech: None, days: 0, slah: 6, note: None },
            TicketDef { title: "Internet lento en food court", desc: "Velocidad por debajo de 5mbps", loc: "Food Court, Nivel 3", cat: 2, pri: "LOW", status: "OPEN", cr: 2, tech: None, days: 1, slah: 2, note: None },
            TicketDef { title: "Puerta de emergencia trabada", desc: "No abre correctamente", loc: "Pasillo B, Nivel 1", cat: 3, pri: "CRITICAL", status: "OPEN", cr: 3, tech: None, days: 0, slah: 22, note: None },
            TicketDef { title: "Aire acondicionado hace ruido", desc: "Ruido metalico al encender", loc: "Local L-450, Nivel 4", cat: 6, pri: "MEDIUM", status: "OPEN", cr: 5, tech: None, days: 0, slah: 12, note: None },
            TicketDef { title: "Cable expuesto en vitrina", desc: "Cables sin proteccion cerca del mostrador", loc: "Local L-220, Nivel 2", cat: 0, pri: "HIGH", status: "OPEN", cr: 4, tech: None, days: 0, slah: 1, note: None },
            // ASSIGNED (4)
            TicketDef { title: "Corto circuito en vitrina", desc: "Chispas al conectar vitrina refrigerada", loc: "Local L-302, Nivel 3", cat: 0, pri: "CRITICAL", status: "ASSIGNED", cr: 0, tech: Some(0), days: 1, slah: 1, note: None },
            TicketDef { title: "Tuberia rota en bano publico", desc: "Fuga en bano de hombres nivel 2", loc: "Bano Publico, Nivel 2", cat: 1, pri: "HIGH", status: "ASSIGNED", cr: 4, tech: Some(1), days: 1, slah: 3, note: None },
            TicketDef { title: "Router principal sin senal", desc: "No emite senal wifi", loc: "Cuarto telecom, Nivel 1", cat: 2, pri: "HIGH", status: "ASSIGNED", cr: 2, tech: Some(2), days: 0, slah: 3, note: None },
            TicketDef { title: "Goteo persistente en lavamanos", desc: "Grifo no cierra completamente", loc: "Bano Mujeres, Nivel 3", cat: 1, pri: "LOW", status: "ASSIGNED", cr: 5, tech: Some(1), days: 1, slah: 5, note: None },
            // IN_PROGRESS (5)
            TicketDef { title: "Aire acondicionado no enfria", desc: "Sistema central no baja de 28 grados", loc: "Local L-401, Nivel 4", cat: 6, pri: "MEDIUM", status: "IN_PROGRESS", cr: 1, tech: Some(4), days: 2, slah: 10, note: None },
            TicketDef { title: "Luz intermitente en pasillo A", desc: "Las luces parpadean constantemente", loc: "Pasillo A, Nivel 1", cat: 0, pri: "MEDIUM", status: "IN_PROGRESS", cr: 3, tech: Some(0), days: 2, slah: 1, note: None },
            TicketDef { title: "Camara de seguridad offline", desc: "Camara 14 no transmite imagen", loc: "Estacionamiento, Sotano 1", cat: 5, pri: "HIGH", status: "IN_PROGRESS", cr: 6, tech: Some(2), days: 1, slah: 1, note: None },
            TicketDef { title: "Fuga de agua en cocina", desc: "Fuga debajo del fregadero", loc: "Local C-08, Food Court", cat: 1, pri: "MEDIUM", status: "IN_PROGRESS", cr: 2, tech: Some(1), days: 1, slah: 4, note: None },
            TicketDef { title: "UPS agotado en servidores", desc: "Bateria no dura mas de 10 min", loc: "Cuarto Servidores, Sotano 1", cat: 2, pri: "HIGH", status: "IN_PROGRESS", cr: 7, tech: Some(2), days: 1, slah: 6, note: None },
            // AWAITING_CONFIRMATION (3)
            TicketDef { title: "Toma corriente quemada", desc: "Toma de la pared sur dejo de funcionar", loc: "Local L-118, Nivel 1", cat: 0, pri: "HIGH", status: "AWAITING_CONFIRMATION", cr: 0, tech: Some(0), days: 3, slah: -12, note: Some("Diagnostico: cortocircuito por sobrecarga. Se reemplazo la toma y se verifico el cableado completo.") },
            TicketDef { title: "Inundacion en sotano", desc: "Acumulacion de agua en la rampa", loc: "Rampa, Sotano 2", cat: 1, pri: "CRITICAL", status: "AWAITING_CONFIRMATION", cr: 4, tech: Some(1), days: 5, slah: -24, note: Some("Se reparo la tuberia principal y se instalo bomba de achique. Area completamente seca.") },
            TicketDef { title: "Switch de red danado", desc: "Switch del piso 3 no responde", loc: "Rack de red, Nivel 3", cat: 2, pri: "MEDIUM", status: "AWAITING_CONFIRMATION", cr: 1, tech: Some(2), days: 4, slah: -8, note: Some("Se reemplazo el switch por uno nuevo modelo TP-Link TL-SG1024. Red estable.") },
            // RESOLVED (4)
            TicketDef { title: "Alarma contra incendios falsa", desc: "Se activa sin razon en nivel 2", loc: "Nivel 2, Zona Este", cat: 4, pri: "CRITICAL", status: "RESOLVED", cr: 3, tech: Some(0), days: 3, slah: -48, note: None },
            TicketDef { title: "Baldosa rota en entrada", desc: "Baldosa suelta, riesgo de caida", loc: "Entrada Principal", cat: 3, pri: "HIGH", status: "RESOLVED", cr: 6, tech: Some(3), days: 10, slah: -72, note: None },
            TicketDef { title: "Wifi caido en nivel 4", desc: "Ningun dispositivo se conecta", loc: "Nivel 4 completo", cat: 2, pri: "HIGH", status: "RESOLVED", cr: 2, tech: Some(2), days: 6, slah: -48, note: None },
            TicketDef { title: "Vidrio roto en baranda", desc: "Vidrio agrietado en baranda nivel 4", loc: "Baranda, Nivel 4", cat: 3, pri: "HIGH", status: "RESOLVED", cr: 7, tech: Some(3), days: 3, slah: -24, note: None },
            // CLOSED (7)
            TicketDef { title: "Falla electrica general", desc: "Apagon total en nivel 3", loc: "Nivel 3 completo", cat: 0, pri: "CRITICAL", status: "CLOSED", cr: 0, tech: Some(0), days: 15, slah: -168, note: None },
            TicketDef { title: "Fuga de gas en cocina", desc: "Olor a gas detectado", loc: "Local C-03, Food Court", cat: 4, pri: "CRITICAL", status: "CLOSED", cr: 1, tech: Some(1), days: 12, slah: -120, note: None },
            TicketDef { title: "Ascensor fuera de servicio", desc: "Ascensor 2 atascado", loc: "Ascensor 2", cat: 3, pri: "CRITICAL", status: "CLOSED", cr: 4, tech: Some(3), days: 20, slah: -240, note: None },
            TicketDef { title: "Pintura desprendida", desc: "Pintura del pasillo C cayendo", loc: "Pasillo C, Nivel 2", cat: 3, pri: "LOW", status: "CLOSED", cr: 3, tech: Some(1), days: 25, slah: -360, note: None },
            TicketDef { title: "Sensor de humo descalibrado", desc: "Se activa con vapor de plancha", loc: "Local L-515, Nivel 5", cat: 5, pri: "MEDIUM", status: "CLOSED", cr: 6, tech: Some(2), days: 8, slah: -48, note: None },
            TicketDef { title: "Derrame de agua en pasillo", desc: "Piso resbaloso por fuga menor", loc: "Pasillo D, Nivel 1", cat: 7, pri: "MEDIUM", status: "CLOSED", cr: 5, tech: Some(1), days: 14, slah: -120, note: None },
            TicketDef { title: "Extintor vencido", desc: "Extintor del local sin vigencia", loc: "Local L-330, Nivel 3", cat: 4, pri: "HIGH", status: "CLOSED", cr: 7, tech: Some(0), days: 18, slah: -144, note: None },
        ];

        let cat_ids: Vec<i64> = (1..=8).collect();

        println!("Creando {} tickets con datos del centro comercial...", defs.len());

        for (i, t) in defs.iter().enumerate() {
            let ticket_id = Uuid::new_v4().to_string();

            let created_str: String = sqlx::query_scalar(
                "SELECT datetime('now', ?)"
            )
            .bind(format!("-{} days", t.days))
            .fetch_one(pool)
            .await?;

            let due_str: String = sqlx::query_scalar(
                "SELECT datetime(?, ?)"
            )
            .bind(&created_str)
            .bind(format!("{} hours", t.slah))
            .fetch_one(pool)
            .await?;

            let ticket_code = format!("TKT-{:04}", i + 1);

            // Crear ticket
            sqlx::query(
                "INSERT INTO tickets (id, ticket_code, creator_id, category_id, title, description, location, status, priority, due_date, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
            )
            .bind(&ticket_id)
            .bind(&ticket_code)
            .bind(&req_ids[t.cr])
            .bind(cat_ids[t.cat])
            .bind(t.title)
            .bind(t.desc)
            .bind(t.loc)
            .bind(t.status)
            .bind(t.pri)
            .bind(&due_str)
            .bind(&created_str)
            .bind(&created_str)
            .execute(pool)
            .await?;

            // Si tiene resolution note (AWAITING_CONFIRMATION)
            if let Some(note) = t.note {
                let resolved_str: String = sqlx::query_scalar(
                    "SELECT datetime(?, ?)"
                )
                .bind(&created_str)
                .bind(format!("{} hours", t.days * 24 - 12))
                .fetch_one(pool)
                .await?;

                sqlx::query("UPDATE tickets SET resolution_note = ?, resolved_at = ? WHERE id = ?")
                    .bind(note)
                    .bind(&resolved_str)
                    .bind(&ticket_id)
                    .execute(pool)
                    .await?;
            }

            // ─── AUDIT LOGS ───
            let audit_id = Uuid::new_v4().to_string();
            sqlx::query("INSERT INTO audit_logs (id, ticket_id, user_id, action, created_at) VALUES (?, ?, ?, 'TICKET_CREATED', ?)")
                .bind(&audit_id)
                .bind(&ticket_id)
                .bind(&req_ids[t.cr])
                .bind(&created_str)
                .execute(pool)
                .await?;

            if let Some(tech_idx) = t.tech {
                let assign_time: String = sqlx::query_scalar(
                    "SELECT datetime(?, '+30 minutes')"
                )
                .bind(&created_str)
                .fetch_one(pool)
                .await?;

                // ASSIGNMENT
                sqlx::query("INSERT INTO assignments (ticket_id, technician_id, assigned_at) VALUES (?, ?, ?)")
                    .bind(&ticket_id)
                    .bind(&tech_ids[tech_idx])
                    .bind(&assign_time)
                    .execute(pool)
                    .await?;

                // AUDIT: STATUS_CHANGE OPEN -> ASSIGNED
                let al1 = Uuid::new_v4().to_string();
                sqlx::query("INSERT INTO audit_logs (id, ticket_id, user_id, action, old_value, new_value, created_at) VALUES (?, ?, ?, 'STATUS_CHANGE', 'OPEN', 'ASSIGNED', ?)")
                    .bind(&al1).bind(&ticket_id).bind(&admin_id).bind(&assign_time)
                    .execute(pool)
                    .await?;

                // AUDIT: ASSIGNMENT
                let al2 = Uuid::new_v4().to_string();
                sqlx::query("INSERT INTO audit_logs (id, ticket_id, user_id, action, old_value, new_value, created_at) VALUES (?, ?, ?, 'ASSIGNMENT', NULL, ?, ?)")
                    .bind(&al2).bind(&ticket_id).bind(&admin_id).bind(&tech_ids[tech_idx]).bind(&assign_time)
                    .execute(pool)
                    .await?;

                // Para IN_PROGRESS, AWAITING_CONFIRMATION, RESOLVED, CLOSED
                let in_progress_statuses = ["IN_PROGRESS", "AWAITING_CONFIRMATION", "RESOLVED", "CLOSED"];
                if in_progress_statuses.contains(&t.status) {
                    let ip_time: String = sqlx::query_scalar(
                        "SELECT datetime(?, '+1 hours')"
                    )
                    .bind(&created_str)
                    .fetch_one(pool)
                    .await?;

                    let al3 = Uuid::new_v4().to_string();
                    sqlx::query("INSERT INTO audit_logs (id, ticket_id, user_id, action, old_value, new_value, created_at) VALUES (?, ?, ?, 'STATUS_CHANGE', 'ASSIGNED', 'IN_PROGRESS', ?)")
                        .bind(&al3).bind(&ticket_id).bind(&tech_ids[tech_idx]).bind(&ip_time)
                        .execute(pool)
                        .await?;

                    // COMMENT
                    let comment_id = Uuid::new_v4().to_string();
                    sqlx::query("INSERT INTO comments (id, ticket_id, user_id, content, is_internal, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)")
                        .bind(&comment_id)
                        .bind(&ticket_id)
                        .bind(&tech_ids[tech_idx])
                        .bind("Revisando el problema, me dirijo a la ubicacion.")
                        .bind(&ip_time)
                        .bind(&ip_time)
                        .execute(pool)
                        .await?;
                }

                // Para AWAITING_CONFIRMATION, RESOLVED, CLOSED
                let awaiting_statuses = ["AWAITING_CONFIRMATION", "RESOLVED", "CLOSED"];
                if awaiting_statuses.contains(&t.status) {
                    let aw_time: String = sqlx::query_scalar(
                        "SELECT datetime(?, '-30 minutes')"
                    )
                    .bind(&due_str)
                    .fetch_one(pool)
                    .await?;

                    let al4 = Uuid::new_v4().to_string();
                    sqlx::query("INSERT INTO audit_logs (id, ticket_id, user_id, action, old_value, new_value, created_at) VALUES (?, ?, ?, 'STATUS_CHANGE', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', ?)")
                        .bind(&al4).bind(&ticket_id).bind(&tech_ids[tech_idx]).bind(&aw_time)
                        .execute(pool)
                        .await?;
                }

                // CLOSED
                if t.status == "CLOSED" {
                    let closed_time: String = sqlx::query_scalar(
                        "SELECT datetime(?, '+1 hours')"
                    )
                    .bind(&due_str)
                    .fetch_one(pool)
                    .await?;

                    let al5 = Uuid::new_v4().to_string();
                    sqlx::query("INSERT INTO audit_logs (id, ticket_id, user_id, action, old_value, new_value, created_at) VALUES (?, ?, ?, 'STATUS_CHANGE', 'AWAITING_CONFIRMATION', 'CLOSED', ?)")
                        .bind(&al5).bind(&ticket_id).bind(&req_ids[t.cr]).bind(&closed_time)
                        .execute(pool)
                        .await?;
                }
            }
        }

        println!("✅ Seed de centro comercial completado con exito.");
        println!("   Roles: 3 | Categorias: 8 | Admins: 2 | Tecnicos: 5 | Locatarios: 8");
        println!("   Tickets: {} (6 OPEN, 4 ASSIGNED, 5 IN_PROGRESS, 3 AWAITING, 4 RESOLVED, 7 CLOSED)", defs.len());
        println!("   Credenciales:");
        println!("     Admin:     admin@sentinel.local / SentinelAdmin2026!");
        println!("     Tecnico:   carlos.perez@sentinel.local / Tecnico2026!");
        println!("     Locatario: ana.martinez@sentinel.local / Locatario2026!");
    } else {
        println!("Base de datos ya contiene tickets. Saltando seed.");
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
