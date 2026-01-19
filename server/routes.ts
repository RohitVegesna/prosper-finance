import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
// import { registerObjectStorageRoutes } from \"./replit_integrations/object_storage\"; // Removed - using standard file upload
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { addDays, subDays } from "date-fns";

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    tenantId?: string;
  }
}

export async function registerRoutes(
  httpServer: Server | null,
  app: Express
): Promise<Server | null> {
  // 1. Setup Session
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  app.set("trust proxy", 1);
  app.use(session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  }));

  // 2. Setup Object Storage
  // Object storage routes (removed - using standard file upload instead)
  // registerObjectStorageRoutes(app);

  // 3. Auth Routes (Public)
  const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    domain: z.string().min(2, "Domain must be at least 2 characters"),
  });

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const input = registerSchema.parse(req.body);
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(input.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Get or create tenant by domain
      let tenant = await storage.getTenantByDomain(input.domain);
      if (!tenant) {
        tenant = await storage.createTenant({
          name: input.domain,
          domain: input.domain,
          subdomain: input.domain,
        });
      }

      // Check if first user in tenant (will be admin)
      const existingUsers = await storage.getUsersByTenant(tenant.id);
      const isFirstUser = existingUsers.length === 0;

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 10);

      // Create user
      const user = await storage.createUser({
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        tenantId: tenant.id,
        role: isFirstUser ? 'admin' : 'user',
      });

      // Set session
      req.session.userId = user.id;
      req.session.tenantId = user.tenantId!;

      res.status(201).json({ 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Registration error:", err);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const input = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(input.email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const validPassword = await bcrypt.compare(input.password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Set session
      req.session.userId = user.id;
      req.session.tenantId = user.tenantId || undefined;

      res.json({ 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Login error:", err);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out" });
    });
  });

  // Change Password (self-service)
  const changePasswordSchema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
  });

  app.post("/api/auth/change-password", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const input = changePasswordSchema.parse(req.body);
      const user = await storage.getUser(req.session.userId);
      
      if (!user || !user.passwordHash) {
        return res.status(404).json({ message: "User not found" });
      }

      const validPassword = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!validPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const newPasswordHash = await bcrypt.hash(input.newPassword, 10);
      await storage.updateUserPassword(user.id, newPasswordHash);

      res.json({ message: "Password changed successfully" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Change password error:", err);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // 4. Authentication Middleware
  const isAuthenticated: RequestHandler = (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // 5. Protected API Routes
  app.use("/api", (req, res, next) => {
    // Skip auth check for public routes
    const publicPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/logout'];
    if (publicPaths.includes(req.path)) {
      return next();
    }
    isAuthenticated(req, res, next);
  });

  // Get current user with tenant/domain info
  app.get("/api/auth/user", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get tenant domain info
      let domain: string | null = null;
      if (user.tenantId) {
        const tenant = await storage.getTenant(user.tenantId);
        domain = tenant?.domain || null;
      }
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        domain,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Policies
  app.get(api.policies.list.path, async (req, res) => {
    const policies = await storage.getPolicies(req.session.tenantId!);
    res.json(policies);
  });

  app.get(api.policies.get.path, async (req, res) => {
    const policy = await storage.getPolicy(Number(req.params.id), req.session.tenantId!);
    if (!policy) return res.status(404).json({ message: "Policy not found" });
    res.json(policy);
  });

  app.post(api.policies.create.path, async (req, res) => {
    try {
      const input = api.policies.create.input.parse(req.body);
      const policy = await storage.createPolicy({ ...input, tenantId: req.session.tenantId! });
      res.status(201).json(policy);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.policies.update.path, async (req, res) => {
    try {
      const input = api.policies.update.input.parse(req.body);
      const policy = await storage.updatePolicy(Number(req.params.id), req.session.tenantId!, input);
      if (!policy) return res.status(404).json({ message: "Policy not found" });
      res.json(policy);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.policies.delete.path, async (req, res) => {
    await storage.deletePolicy(Number(req.params.id), req.session.tenantId!);
    res.status(204).send();
  });

  // Investments
  app.get(api.investments.list.path, async (req, res) => {
    const investments = await storage.getInvestments(req.session.tenantId!);
    res.json(investments);
  });

  app.post(api.investments.create.path, async (req, res) => {
    try {
      const input = api.investments.create.input.parse(req.body);
      const investment = await storage.createInvestment({ ...input, tenantId: req.session.tenantId! });
      res.status(201).json(investment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.investments.update.path, async (req, res) => {
    try {
      const input = api.investments.update.input.parse(req.body);
      const investment = await storage.updateInvestment(Number(req.params.id), req.session.tenantId!, input);
      if (!investment) return res.status(404).json({ message: "Investment not found" });
      res.json(investment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.investments.delete.path, async (req, res) => {
    await storage.deleteInvestment(Number(req.params.id), req.session.tenantId!);
    res.status(204).send();
  });

  // Dashboard
  app.get(api.dashboard.stats.path, async (req, res) => {
    const stats = await storage.getDashboardStats(req.session.tenantId!);
    res.json(stats);
  });

  // Dashboard analytics endpoint
  app.get("/api/dashboard/analytics", async (req, res) => {
    console.log('=== ANALYTICS ENDPOINT CALLED ===');
    try {
      if (!req.session.userId) {
        console.log('No user session found');
        return res.status(401).json({ message: "Unauthorized" });
      }

      const tenantId = req.session.tenantId!;
      console.log('Tenant ID:', tenantId);
      
      // Get all policies and investments for the tenant
      const policies = await storage.getPolicies(tenantId);
      const investments = await storage.getInvestments(tenantId);
      
      console.log('Found policies:', policies?.length || 0, 'investments:', investments?.length || 0);
      console.log('Raw policies:', JSON.stringify(policies, null, 2));
      console.log('Raw investments:', JSON.stringify(investments, null, 2));

      // Analytics: Investments by Type
      const investmentsByType = investments.map(inv => ({
        type: inv.type || 'Unknown',
        value: parseFloat(inv.currentValue || '0'),
        count: 1
      }));

      // Analytics: Investments by Platform
      const investmentsByPlatform = investments.map(inv => ({
        platform: inv.platform || 'Unknown',
        value: parseFloat(inv.currentValue || '0'),
        count: 1
      }));

      // Analytics: Premiums by Provider
      const premiumsByProvider = policies.map(pol => {
        console.log('Mapping policy:', pol.provider, 'currency:', pol.premiumCurrency);
        return {
          provider: pol.provider || 'Unknown',
          monthlyPremium: parseFloat(pol.premium || '0') / (pol.premiumFrequency === 'yearly' ? 12 : 1),
          yearlyPremium: parseFloat(pol.premium || '0') * (pol.premiumFrequency === 'yearly' ? 1 : 12),
          policyCount: 1,
          currency: pol.premiumCurrency || 'SEK'
        };
      });

      // Analytics: Upcoming Renewals (simplified for now)
      const upcomingRenewals: any[] = [];

      const analyticsData = {
        investmentsByType,
        investmentsByPlatform,
        premiumsByProvider,
        upcomingRenewals
      };
      
      console.log('Sending response:', JSON.stringify(analyticsData, null, 2));
      res.json(analyticsData);
    } catch (err) {
      console.error("Dashboard analytics error:", err);
      res.status(500).json({ message: "Failed to get dashboard analytics" });
    }
  });

  // Admin: User Management
  const isAdmin: RequestHandler = async (req, res, next) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  app.get("/api/admin/users", isAdmin, async (req, res) => {
    const users = await storage.getUsersByTenant(req.session.tenantId!);
    res.json(users);
  });

  app.put("/api/admin/users/:userId/role", isAdmin, async (req, res) => {
    const userId = req.params.userId as string;
    const role = req.body.role as string;
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    if (userId === req.session.userId && role === 'user') {
      return res.status(400).json({ message: "Cannot demote yourself. Ask another admin to change your role." });
    }
    const updated = await storage.updateUserRole(userId, req.session.tenantId!, role as 'admin' | 'user');
    if (!updated) return res.status(404).json({ message: "User not found" });
    res.json(updated);
  });

  app.delete("/api/admin/users/:userId", isAdmin, async (req, res) => {
    const userId = req.params.userId as string;
    if (userId === req.session.userId) {
      return res.status(400).json({ message: "Cannot remove yourself" });
    }
    await storage.removeUserFromTenant(userId, req.session.tenantId!);
    res.status(204).send();
  });

  // Admin: Reset user password
  const adminResetPasswordSchema = z.object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
  });

  app.put("/api/admin/users/:userId/reset-password", isAdmin, async (req, res) => {
    try {
      const userId = req.params.userId as string;
      const input = adminResetPasswordSchema.parse(req.body);
      
      // Verify user belongs to the same tenant
      const targetUser = await storage.getUser(userId);
      if (!targetUser || targetUser.tenantId !== req.session.tenantId) {
        return res.status(404).json({ message: "User not found" });
      }

      const newPasswordHash = await bcrypt.hash(input.newPassword, 10);
      await storage.updateUserPassword(userId, newPasswordHash);

      res.json({ message: "Password reset successfully" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Admin reset password error:", err);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  return httpServer;
}
