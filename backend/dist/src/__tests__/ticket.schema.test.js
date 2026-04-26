import { describe, it, expect } from 'vitest';
import { createTicketSchema, updateStatusSchema, resolveTicketSchema, confirmTicketSchema } from '../schemas/ticket.schema.js';
describe('Ticket Schema Validation', () => {
    describe('createTicketSchema', () => {
        it('should accept valid ticket data', () => {
            const result = createTicketSchema.safeParse({
                title: 'Fallo eléctrico en luminaria',
                description: 'La luminaria del pasillo norte no enciende desde ayer',
                location: 'Planta 2, Pasillo Norte',
                categoryId: 1,
                priority: 'HIGH',
            });
            expect(result.success).toBe(true);
        });
        it('should reject short title', () => {
            const result = createTicketSchema.safeParse({
                title: 'Hola',
                description: 'Descripción válida del problema',
                location: 'Planta 1',
                categoryId: 1,
                priority: 'LOW',
            });
            expect(result.success).toBe(false);
        });
        it('should reject short description', () => {
            const result = createTicketSchema.safeParse({
                title: 'Título válido',
                description: 'Corta',
                location: 'Planta 1',
                categoryId: 1,
                priority: 'LOW',
            });
            expect(result.success).toBe(false);
        });
        it('should reject invalid priority', () => {
            const result = createTicketSchema.safeParse({
                title: 'Título válido',
                description: 'Descripción válida del problema',
                location: 'Planta 1',
                categoryId: 1,
                priority: 'SUPER_HIGH',
            });
            expect(result.success).toBe(false);
        });
        it('should accept all valid priorities', () => {
            const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
            priorities.forEach(priority => {
                const result = createTicketSchema.safeParse({
                    title: 'Título válido',
                    description: 'Descripción válida del problema',
                    location: 'Planta 1',
                    categoryId: 1,
                    priority,
                });
                expect(result.success, `Priority ${priority} should be valid`).toBe(true);
            });
        });
        it('should reject negative categoryId', () => {
            const result = createTicketSchema.safeParse({
                title: 'Título válido',
                description: 'Descripción válida del problema',
                location: 'Planta 1',
                categoryId: -1,
                priority: 'LOW',
            });
            expect(result.success).toBe(false);
        });
    });
    describe('updateStatusSchema', () => {
        it('should accept all valid statuses including AWAITING_CONFIRMATION', () => {
            const statuses = [
                'OPEN', 'ASSIGNED', 'IN_PROGRESS',
                'ON_HOLD', 'RESOLVED', 'AWAITING_CONFIRMATION', 'CLOSED',
            ];
            statuses.forEach(status => {
                const result = updateStatusSchema.safeParse({ status });
                expect(result.success, `Status ${status} should be valid`).toBe(true);
            });
        });
        it('should reject invalid status', () => {
            const result = updateStatusSchema.safeParse({ status: 'INVALID_STATUS' });
            expect(result.success).toBe(false);
        });
    });
    describe('resolveTicketSchema', () => {
        it('should accept valid resolution note', () => {
            const result = resolveTicketSchema.safeParse({
                resolutionNote: 'Se reemplazó la luminaria defectuosa y se verificó el circuito.',
            });
            expect(result.success).toBe(true);
        });
        it('should reject short resolution note', () => {
            const result = resolveTicketSchema.safeParse({
                resolutionNote: 'Listo.',
            });
            expect(result.success).toBe(false);
        });
        it('should reject empty resolution note', () => {
            const result = resolveTicketSchema.safeParse({
                resolutionNote: '',
            });
            expect(result.success).toBe(false);
        });
    });
    describe('confirmTicketSchema', () => {
        it('should accept confirmation with comment', () => {
            const result = confirmTicketSchema.safeParse({
                confirmed: true,
                ratingComment: 'Excelente servicio, muy rápido.',
            });
            expect(result.success).toBe(true);
        });
        it('should accept confirmation without comment', () => {
            const result = confirmTicketSchema.safeParse({
                confirmed: true,
            });
            expect(result.success).toBe(true);
        });
        it('should accept reopening with reason', () => {
            const result = confirmTicketSchema.safeParse({
                confirmed: false,
                ratingComment: 'El problema persiste, la luminaria sigue sin encender.',
            });
            expect(result.success).toBe(true);
        });
        it('should reject when confirmed is missing', () => {
            const result = confirmTicketSchema.safeParse({
                ratingComment: 'Comentario sin confirmación',
            });
            expect(result.success).toBe(false);
        });
        it('should reject non-boolean confirmed field', () => {
            const result = confirmTicketSchema.safeParse({
                confirmed: 'yes',
            });
            expect(result.success).toBe(false);
        });
    });
});
