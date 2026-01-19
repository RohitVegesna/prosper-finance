import { z } from 'zod';
import { insertPolicySchema, insertInvestmentSchema, policies, investments } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  policies: {
    list: {
      method: 'GET' as const,
      path: '/api/policies',
      input: z.object({
        search: z.string().optional(),
        status: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof policies.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/policies/:id',
      responses: {
        200: z.custom<typeof policies.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/policies',
      input: insertPolicySchema,
      responses: {
        201: z.custom<typeof policies.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/policies/:id',
      input: insertPolicySchema.partial(),
      responses: {
        200: z.custom<typeof policies.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/policies/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  investments: {
    list: {
      method: 'GET' as const,
      path: '/api/investments',
      responses: {
        200: z.array(z.custom<typeof investments.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/investments',
      input: insertInvestmentSchema,
      responses: {
        201: z.custom<typeof investments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/investments/:id',
      input: insertInvestmentSchema.partial(),
      responses: {
        200: z.custom<typeof investments.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/investments/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  dashboard: {
    stats: {
      method: 'GET' as const,
      path: '/api/dashboard/stats',
      responses: {
        200: z.object({
          totalPolicies: z.number(),
          expiringSoon: z.number(), // 30-60 days
          needsRenewal: z.number(), // < 30 days or expired
          totalInvestments: z.number(),
          investmentsByCurrency: z.object({
            SEK: z.number(),
            INR: z.number(),
          }),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type PolicyResponse = z.infer<typeof api.policies.create.responses[201]>;
export type InvestmentResponse = z.infer<typeof api.investments.create.responses[201]>;
export type DashboardStatsResponse = z.infer<typeof api.dashboard.stats.responses[200]>;

// Add input types for the hooks
export type CreatePolicyRequest = z.infer<typeof api.policies.create.input>;
export type UpdatePolicyRequest = z.infer<typeof api.policies.update.input>;
export type CreateInvestmentRequest = z.infer<typeof api.investments.create.input>;
export type UpdateInvestmentRequest = z.infer<typeof api.investments.update.input>;
