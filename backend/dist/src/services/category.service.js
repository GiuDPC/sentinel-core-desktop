import { prisma } from '../config/prisma';
import { AppError } from '../utils/app-error';
async function findAll() {
    return prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
    });
}
async function finById(id) {
    const category = await prisma.category.findUnique({
        where: { id },
    });
    if (!category || !category.isActive) {
        throw new AppError(404, 'Categoria no encontrada');
    }
    return category;
}
export const categoryService = { findAll, finById };
