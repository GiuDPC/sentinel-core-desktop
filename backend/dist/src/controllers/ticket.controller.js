import { ticketService } from '../services/ticket.service.js';
import { assignmentService } from '../services/assignment.service.js';
async function create(req, res, next) {
    try {
        const ticket = await ticketService.create({
            ...req.body,
            creatorId: req.user.id,
        });
        res.status(201).json({ ticket });
    }
    catch (error) {
        next(error);
    }
}
async function findAll(req, res, next) {
    try {
        const result = await ticketService.findAll({
            status: req.query.status,
            priority: req.query.priority,
            categoryId: req.query.categoryId
                ? parseInt(req.query.categoryId, 10)
                : undefined,
            page: req.query.page
                ? parseInt(req.query.page, 10)
                : undefined,
            limit: req.query.limit
                ? parseInt(req.query.limit, 10)
                : undefined,
        });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
async function findById(req, res, next) {
    try {
        const ticket = await ticketService.findById(String(req.params.id));
        res.json({ ticket });
    }
    catch (error) {
        next(error);
    }
}
async function updateStatus(req, res, next) {
    try {
        const ticket = await ticketService.updateStatus(String(req.params.id), req.body.status, req.user.id);
        res.json({ ticket });
    }
    catch (error) {
        next(error);
    }
}
async function assignTechnician(req, res, next) {
    try {
        const ticket = await assignmentService.assignTechnician(String(req.params.id), req.body.technicianId, req.user.id);
        res.json({ ticket });
    }
    catch (error) {
        next(error);
    }
}
async function getTechniciansWorkload(req, res, next) {
    try {
        const department = req.query.department;
        const result = await assignmentService.getTechniciansByWorkload(department);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
export const ticketController = {
    create, findAll, findById, updateStatus,
    assignTechnician, getTechniciansWorkload,
};
