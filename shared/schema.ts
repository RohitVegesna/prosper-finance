import { pgTable, text, serial, integer, boolean, timestamp, date, numeric, varchar, json } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

// === SESSION TABLE FOR AUTH ===
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { withTimezone: true }).notNull(),
});

// === TABLE DEFINITIONS ===

export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  domain: text("domain").unique(), // e.g. "smithfamily.finance.app"
  subdomain: text("subdomain").unique(), // e.g. "smithfamily"
  createdAt: timestamp("created_at").defaultNow(),
});

export const policies = pgTable("policies", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenant_id").notNull(), // Link to tenant
  provider: text("provider").notNull(),
  policyName: text("policy_name").notNull(),
  policyNumber: text("policy_number"), // New field
  policyType: text("policy_type").notNull(), // Health, Life, Vehicle, etc.
  country: text("country").notNull(),
  startDate: date("start_date").notNull(), // Already exists
  maturityDate: date("maturity_date"), // Using maturity instead of expiry
  nextRenewalDate: date("next_renewal_date"), // New field
  lastPremiumDate: date("last_premium_date"), // New field
  premium: numeric("premium"), // New field
  premiumCurrency: text("premium_currency").default("SEK"), // New field - SEK or INR
  premiumFrequency: text("premium_frequency"), // New field - monthly, quarterly, yearly, etc.
  nominee: text("nominee"), // New field
  beneficiaryType: text("beneficiary_type"), // New field - FAMILY, PARENTS as badge
  paidTo: text("paid_to"), // New field - who the policy amount is paid to
  renewalStatus: text("renewal_status").default("active"), // active, expired, expiring_soon
  notes: text("notes"),
  documentUrl: text("document_url"), // URL from object storage
  createdAt: timestamp("created_at").defaultNow(),
});

export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenant_id").notNull(), // Link to tenant
  type: text("type").notNull(), // Stocks, Mutual Funds, ETFs, Crypto
  platform: text("platform").notNull(), // Broker/Platform
  country: text("country").notNull().default("SWEDEN"), // SWEDEN or INDIA
  currency: text("currency").notNull().default("SEK"), // SEK or INR
  initialAmount: numeric("initial_amount").notNull(), // Original investment amount
  currentValue: numeric("current_value").notNull(), // Current market value
  shares: numeric("shares"), // Number of shares/units (optional)
  purchaseDate: date("purchase_date"), // When the investment was made
  lastUpdated: timestamp("last_updated").defaultNow(), // When values were last updated
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  policies: many(policies),
  investments: many(investments),
}));

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
}));

export const policiesRelations = relations(policies, ({ one }) => ({
  tenant: one(tenants, {
    fields: [policies.tenantId],
    references: [tenants.id],
  }),
}));

export const investmentsRelations = relations(investments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [investments.tenantId],
    references: [tenants.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true });
export const insertPolicySchema = createInsertSchema(policies).omit({ id: true, createdAt: true, renewalStatus: true }).extend({
  startDate: z.string().min(1, "Start date is required").transform((val) => val && val.trim() !== "" ? val : undefined),
  maturityDate: z.union([z.string(), z.null()]).optional().transform((val) => val && typeof val === 'string' && val.trim() !== "" ? val : undefined),
  nextRenewalDate: z.union([z.string(), z.null()]).optional().transform((val) => val && typeof val === 'string' && val.trim() !== "" ? val : undefined),
  lastPremiumDate: z.union([z.string(), z.null()]).optional().transform((val) => val && typeof val === 'string' && val.trim() !== "" ? val : undefined),
});
export const insertInvestmentSchema = createInsertSchema(investments).omit({ id: true, createdAt: true }).extend({
  shares: z.string().optional().transform((val) => val && val.trim() !== "" ? val : undefined),
  purchaseDate: z.string().optional().transform((val) => val && val.trim() !== "" ? val : undefined),
  lastUpdated: z.string().optional().transform((val) => val && val.trim() !== "" ? val : undefined),
});

// === EXPLICIT API CONTRACT TYPES ===

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export type Policy = typeof policies.$inferSelect;
export type InsertPolicy = z.infer<typeof insertPolicySchema>;
export type CreatePolicyRequest = InsertPolicy;
export type UpdatePolicyRequest = Partial<InsertPolicy>;

export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type CreateInvestmentRequest = InsertInvestment;
export type UpdateInvestmentRequest = Partial<InsertInvestment>;

// Export auth models as well so everything is available from @shared/schema
export * from "./models/auth";
