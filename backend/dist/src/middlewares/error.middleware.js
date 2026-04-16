import { AppError } from '../utils/app-error.js';
export function errorHandler(err, _req, res, _next) {
    console.error(`[ERROR] ${err.message}`);
    console.error(err);
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
    }
    res.status(500).json({ error: 'Error interno del servidor' });
}
