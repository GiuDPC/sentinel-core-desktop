import { commentService } from '../services/comment.service.js';
async function create(req, res, next) {
    try {
        const comment = await commentService.create({
            ticketId: String(req.params.ticketId),
            userId: req.user.id,
            content: req.body.content,
            isInternal: req.body.isInternal,
        });
        res.status(201).json({ comment });
    }
    catch (error) {
        next(error);
    }
}
async function findByTicketId(req, res, next) {
    try {
        const comments = await commentService.findByTicketId(String(req.params.ticketId), req.user.role);
        res.json({ comments });
    }
    catch (error) {
        next(error);
    }
}
export const commentController = { create, findByTicketId };
