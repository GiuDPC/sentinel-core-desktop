use serde::Serialize;
use std::fmt;

#[derive(Debug)]
pub enum AppError {
    Database(String),
    Auth(String),
    NotFound(String),
    Internal(String),
    Validation(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Database(msg) => write!(f, "Error de base de datos: {}", msg),
            AppError::Auth(msg) => write!(f, "Error de autenticación: {}", msg),
            AppError::NotFound(msg) => write!(f, "No encontrado: {}", msg),
            AppError::Internal(msg) => write!(f, "Error interno: {}", msg),
            AppError::Validation(msg) => write!(f, "Error de validación: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}

// Implementamos Serialize para que Tauri pueda enviar el error al frontend como un JSON/String limpio
impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

// Convertimos errores de SQLx automáticamente a AppError::Database
impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::Database(err.to_string())
    }
}

// Convertimos errores de Argon2 automáticamente a AppError::Internal
impl From<argon2::password_hash::Error> for AppError {
    fn from(err: argon2::password_hash::Error) -> Self {
        AppError::Internal(format!("Error de seguridad (hashing): {}", err))
    }
}

// Convertimos errores de IO automáticamente a AppError::Internal
impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Internal(err.to_string())
    }
}
