import { categoryService } from '../services/category.service';
async function findAll(_req, res, next) {
    try {
        const categories = await categoryService.findAll();
        res.json({ categories });
    }
    catch (error) {
        next(error);
    }
}
async function findById(req, res, next) {
    try {
        const id = parseInt(String(req.params.id), 10);
        const category = await categoryService.finById(id);
        res.json({ category });
    }
    catch (error) {
        next(error);
    }
}
export const categoryController = { findAll, findById };
