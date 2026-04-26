import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
/**
 * Middleware de autenticación.
 * Soporta dos métodos (para compatibilidad web + desktop/Tauri):
 * 1. Cookie httpOnly `token` (prioridad)
 * 2. Header `Authorization: Bearer <token>` (fallback)
 */
export function authMiddleware(req, res, next) {
    // Primero intentar cookie
    let token = req.cookies?.token;
    // Fallback: Authorization header (Bearer)
    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        }
    }
    if (!token) {
        res.status(401).json({ error: 'No autenticado' });
        return;
    }
    try {
        const payload = jwt.verify(token, env.JWT_SECRET);
        req.user = payload;
        next();
    }
    catch {
        res.status(401).json({ error: 'Token invalido o expirado' });
    }
}
