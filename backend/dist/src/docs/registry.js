import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
export const registry = new OpenAPIRegistry();
// Ya no usamos bearerAuth porque la API funciona estrictamente con Cookies.
// Swagger leerá automáticamente la cookie 'token' que el navegador guarde al hacer login.
export const cookieAuth = registry.registerComponent('securitySchemes', 'cookieAuth', {
    type: 'apiKey',
    in: 'cookie',
    name: 'token',
});
