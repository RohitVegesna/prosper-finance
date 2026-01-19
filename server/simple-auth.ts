import type { Express } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { z } from "zod";

// Simple auth routes without session dependency for testing
export async function registerSimpleAuthRoutes(app: Express) {
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

  // Test endpoint
  app.get("/api/test", (req, res) => {
    res.json({ 
      message: "API is working", 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      hasDb: !!process.env.NEON_DATABASE_URL,
      hasSession: !!process.env.SESSION_SECRET
    });
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log("Registration request received:", req.body);
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

      res.status(201).json({ 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        message: "User created successfully"
      });
    } catch (err) {
      console.error("Registration error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Registration failed", error: err.message });
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

      res.json({ 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        message: "Login successful"
      });
    } catch (err) {
      console.error("Login error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Login failed", error: err.message });
    }
  });
}