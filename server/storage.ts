import { db } from "./db";
import {
  users, policies, investments, tenants,
  type User,
  type Policy, type InsertPolicy, type CreatePolicyRequest, type UpdatePolicyRequest,
  type Investment, type InsertInvestment, type CreateInvestmentRequest, type UpdateInvestmentRequest,
  type Tenant, type InsertTenant
} from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export interface IStorage {
  // Tenants
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantByDomain(domain: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;

  // Users (extending auth storage somewhat)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: { email: string; passwordHash: string; firstName?: string; lastName?: string; tenantId?: string; role?: string }): Promise<User>;
  updateUserTenant(userId: string, tenantId: string): Promise<User>;
  getUsersByTenant(tenantId: string): Promise<User[]>;
  updateUserRole(userId: string, tenantId: string, role: 'admin' | 'user'): Promise<User | undefined>;
  updateUserPassword(userId: string, passwordHash: string): Promise<User | undefined>;
  removeUserFromTenant(userId: string, tenantId: string): Promise<void>;

  // Policies
  getPolicies(tenantId: string): Promise<Policy[]>;
  getPolicy(id: number, tenantId: string): Promise<Policy | undefined>;
  createPolicy(policy: InsertPolicy): Promise<Policy>;
  updatePolicy(id: number, tenantId: string, updates: UpdatePolicyRequest): Promise<Policy>;
  deletePolicy(id: number, tenantId: string): Promise<void>;

  // Investments
  getInvestments(tenantId: string): Promise<Investment[]>;
  getInvestment(id: number, tenantId: string): Promise<Investment | undefined>;
  createInvestment(investment: InsertInvestment): Promise<Investment>;
  updateInvestment(id: number, tenantId: string, updates: UpdateInvestmentRequest): Promise<Investment>;
  deleteInvestment(id: number, tenantId: string): Promise<void>;

  // Dashboard
  getDashboardStats(tenantId: string): Promise<{
    totalPolicies: number;
    expiringSoon: number;
    needsRenewal: number;
    totalInvestments: number;
    investmentsByCurrency: {
      SEK: number;
      INR: number;
    };
  }>;
}

export class DatabaseStorage implements IStorage {
  // Tenants
  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async getTenantByDomain(domain: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.domain, domain));
    return tenant;
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const [newTenant] = await db.insert(tenants).values(tenant).returning();
    return newTenant;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: { email: string; passwordHash: string; firstName?: string; lastName?: string; tenantId?: string; role?: string }): Promise<User> {
    const [newUser] = await db.insert(users).values({
      email: user.email,
      passwordHash: user.passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      tenantId: user.tenantId,
      role: user.role || 'user',
    }).returning();
    return newUser;
  }

  async updateUserTenant(userId: string, tenantId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ tenantId })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async getUsersByTenant(tenantId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.tenantId, tenantId));
  }

  async updateUserRole(userId: string, tenantId: string, role: 'admin' | 'user'): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ role })
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
      .returning();
    return updated;
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async removeUserFromTenant(userId: string, tenantId: string): Promise<void> {
    await db
      .update(users)
      .set({ tenantId: null, role: 'user' })
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)));
  }

  // Policies
  async getPolicies(tenantId: string): Promise<Policy[]> {
    return await db.select().from(policies).where(eq(policies.tenantId, tenantId)).orderBy(desc(policies.createdAt));
  }

  async getPolicy(id: number, tenantId: string): Promise<Policy | undefined> {
    const [policy] = await db
      .select()
      .from(policies)
      .where(and(eq(policies.id, id), eq(policies.tenantId, tenantId)));
    return policy;
  }

  async createPolicy(policy: InsertPolicy): Promise<Policy> {
    const [newPolicy] = await db.insert(policies).values(policy).returning();
    return newPolicy;
  }

  async updatePolicy(id: number, tenantId: string, updates: UpdatePolicyRequest): Promise<Policy> {
    const [updated] = await db
      .update(policies)
      .set(updates)
      .where(and(eq(policies.id, id), eq(policies.tenantId, tenantId)))
      .returning();
    return updated;
  }

  async deletePolicy(id: number, tenantId: string): Promise<void> {
    await db
      .delete(policies)
      .where(and(eq(policies.id, id), eq(policies.tenantId, tenantId)));
  }

  // Investments
  async getInvestments(tenantId: string): Promise<Investment[]> {
    return await db.select().from(investments).where(eq(investments.tenantId, tenantId)).orderBy(desc(investments.createdAt));
  }

  async getInvestment(id: number, tenantId: string): Promise<Investment | undefined> {
    const [investment] = await db
      .select()
      .from(investments)
      .where(and(eq(investments.id, id), eq(investments.tenantId, tenantId)));
    return investment;
  }

  async createInvestment(investment: InsertInvestment): Promise<Investment> {
    const [newInvestment] = await db.insert(investments).values(investment).returning();
    return newInvestment;
  }

  async updateInvestment(id: number, tenantId: string, updates: UpdateInvestmentRequest): Promise<Investment> {
    // Automatically set lastUpdated when updating investment
    const updatesWithTimestamp = {
      ...updates,
      lastUpdated: new Date()
    };
    
    const [updated] = await db
      .update(investments)
      .set(updatesWithTimestamp)
      .where(and(eq(investments.id, id), eq(investments.tenantId, tenantId)))
      .returning();
    return updated;
  }

  async deleteInvestment(id: number, tenantId: string): Promise<void> {
    await db
      .delete(investments)
      .where(and(eq(investments.id, id), eq(investments.tenantId, tenantId)));
  }

  // Dashboard
  async getDashboardStats(tenantId: string): Promise<{
    totalPolicies: number;
    expiringSoon: number;
    needsRenewal: number;
    totalInvestments: number;
    investmentsByCurrency: {
      SEK: number;
      INR: number;
    };
  }> {
    const now = new Date();
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(now.getDate() + 60);

    const policiesList = await this.getPolicies(tenantId);
    
    let expiringSoon = 0;
    let needsRenewal = 0;

    for (const p of policiesList) {
      // Check renewal dates (next renewal date within 60 days)
      if (p.nextRenewalDate) {
        const renewal = new Date(p.nextRenewalDate);
        if (renewal <= sixtyDaysFromNow) {
          needsRenewal++;
        }
      }
      
      // Check maturity dates (policies maturing within 60 days)
      if (p.maturityDate) {
        const maturity = new Date(p.maturityDate);
        if (maturity <= sixtyDaysFromNow && maturity > now) {
          expiringSoon++;
        }
      }
    }

    const investmentsList = await this.getInvestments(tenantId);
    const totalInvestments = investmentsList.length;
    
    // Calculate totals by currency
    const investmentsByCurrency = {
      SEK: investmentsList.filter(inv => inv.currency === 'SEK').reduce((sum, inv) => sum + Number(inv.currentValue), 0),
      INR: investmentsList.filter(inv => inv.currency === 'INR').reduce((sum, inv) => sum + Number(inv.currentValue), 0),
    };

    return {
      totalPolicies: policiesList.length,
      expiringSoon,
      needsRenewal,
      totalInvestments,
      investmentsByCurrency,
    };
  }
}

export const storage = new DatabaseStorage();
