import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

// Resusable definitions
const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  summary: 'Iniciar sesión',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: loginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login exitoso y cookie de sesión establecida',
      content: {
        'application/json': {
          schema: z.object({
            user: z.object({
              id: z.number(),
              email: z.string(),
              role: z.string()
            })
          })
        }
      }
    },
    400: { description: 'Error de validación' }
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/register-public',
  summary: 'Registro público de ciudadano',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: registerSchema,
        },
      },
    },
  },
  responses: {
    201: { description: 'Usuario creado exitosamente' },
    400: { description: 'Error de validación o usuario existente' }
  },
});

export function generateOpenApiConfig() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'Sentinel-Core API',
      description: 'API Documentada autogenerada con Zod para Sentinel-Core.',
    },
    servers: [{ url: 'http://localhost:5000' }],
  });
}
