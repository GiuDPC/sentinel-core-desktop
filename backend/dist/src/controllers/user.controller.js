import { userService } from '../services/user.service.js';
async function findAll(_req, res, next) {
    try {
        const users = await userService.findAll();
        res.json({ users });
    }
    catch (error) {
        next(error);
    }
}
async function findById(req, res, next) {
    try {
        const user = await userService.findById(String(req.params.id));
        res.json({ user });
    }
    catch (error) {
        next(error);
    }
}
async function update(req, res, next) {
    try {
        const user = await userService.update(String(req.params.id), req.body);
        res.json({ user });
    }
    catch (error) {
        next(error);
    }
}
async function softDelete(req, res, next) {
    try {
        const result = await userService.softDelete(String(req.params.id));
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}
async function updateProfile(req, res, next) {
    try {
        const user = await userService.updateProfile(req.user.id, req.body);
        res.json({ user });
    }
    catch (error) {
        next(error);
    }
}
export const userController = { findAll, findById, update, softDelete, updateProfile };
