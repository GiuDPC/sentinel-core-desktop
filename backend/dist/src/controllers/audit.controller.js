import { auditService } from '../services/audit.service.js';
async function findAll(req, res, next) {
    try {
        const result = await auditService.findAll({
            page: req.query.page ? parseInt(req.query.page, 10) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
            action: req.query.action,
        });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
export const auditController = { findAll };
