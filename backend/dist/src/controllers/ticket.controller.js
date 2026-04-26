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
            search: req.query.search,
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
        const ticket = await ticketService.updateStatus(String(req.params.id), req.body.status, req.user.id, req.user.role);
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
async function reassignTechnician(req, res, next) {
    try {
        const ticket = await assignmentService.reassignTechnician(String(req.params.id), req.body.technicianId, req.user.id);
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
async function findMyTickets(req, res, next) {
    try {
        const result = await ticketService.findByCreator(req.user.id, {
            status: req.query.status,
            page: req.query.page ? parseInt(req.query.page, 10) : undefined,
        });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
async function findAssigned(req, res, next) {
    try {
        const result = await ticketService.findAssigned(req.user.id, {
            status: req.query.status,
        });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
async function resolveWithNote(req, res, next) {
    try {
        const ticket = await ticketService.resolveWithNote(String(req.params.id), { resolutionNote: req.body.resolutionNote }, req.user.id);
        res.json({ ticket });
    }
    catch (error) {
        next(error);
    }
}
async function confirmTicket(req, res, next) {
    try {
        const ticket = await ticketService.confirmTicket(String(req.params.id), {
            confirmed: req.body.confirmed,
            ratingComment: req.body.ratingComment,
        }, req.user.id);
        res.json({ ticket });
    }
    catch (error) {
        next(error);
    }
}
export const ticketController = {
    create, findAll, findById, updateStatus,
    assignTechnician, reassignTechnician, getTechniciansWorkload,
    findMyTickets, findAssigned,
    resolveWithNote, confirmTicket,
};
