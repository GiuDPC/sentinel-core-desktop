import { authService } from '../services/auth.service.js';
async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.cookie('token', result.token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 8 * 60 * 60 * 1000,
        });
        res.json({ user: result.user });
    }
    catch (error) {
        next(error);
    }
}
async function register(req, res, next) {
    try {
        const user = await authService.register(req.body);
        res.status(201).json({ user });
    }
    catch (error) {
        next(error);
    }
}
async function logout(_req, res) {
    res.clearCookie('token');
    res.json({ message: 'Sesión cerrada' });
}
async function me(req, res) {
    res.json({ user: req.user });
}
async function registerPublic(req, res, next) {
    try {
        const user = await authService.registerPublic(req.body);
        res.status(201).json({ user });
    }
    catch (error) {
        next(error);
    }
}
export const authController = { login, register, logout, me, registerPublic };
