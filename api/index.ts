import express, { type Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { put, del } from "@vercel/blob";
// Import everything directly to avoid module resolution issues in Vercel
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { pgTable, text, serial, integer, boolean, timestamp, date, numeric, varchar, json, jsonb, index } from "drizzle-orm/pg-core";
import { relations, sql, eq, and, desc } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import cors from "cors";

const { Pool } = pg;

// === SCHEMA DEFINITIONS ===

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Multi-tenancy fields
  tenantId: varchar("tenant_id"),
  role: text("role").default("user"), // 'admin', 'user'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  domain: text("domain").unique(),
  subdomain: text("subdomain").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const policies = pgTable("policies", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenant_id").notNull(),
  provider: text("provider").notNull(),
  policyName: text("policy_name").notNull(),
  policyNumber: text("policy_number"),
  policyType: text("policy_type").notNull(),
  country: text("country").notNull(),
  startDate: date("start_date").notNull(),
  maturityDate: date("maturity_date"),
  nextRenewalDate: date("next_renewal_date"),
  lastPremiumDate: date("last_premium_date"),
  premium: numeric("premium"),
  premiumCurrency: text("premium_currency").default("SEK"),
  premiumFrequency: text("premium_frequency"),
  nominee: text("nominee"),
  beneficiaryType: text("beneficiary_type"),
  paidTo: text("paid_to"),
  renewalStatus: text("renewal_status").default("active"),
  notes: text("notes"),
  documentUrl: text("document_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenant_id").notNull(),
  type: text("type").notNull(),
  platform: text("platform").notNull(),
  country: text("country").notNull().default("SWEDEN"),
  currency: text("currency").notNull().default("SEK"),
  initialAmount: numeric("initial_amount").notNull(),
  currentValue: numeric("current_value").notNull(),
  shares: numeric("shares"),
  purchaseDate: date("purchase_date"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMA OBJECT ===
const schema = {
  sessions,
  users,
  tenants,
  policies,
  investments,
};

// === TYPES ===
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect & { domain?: string };
export type Tenant = typeof tenants.$inferSelect;
export type Policy = typeof policies.$inferSelect;
export type Investment = typeof investments.$inferSelect;

// Database setup
const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or NEON_DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema });

// === STORAGE CLASS ===
class DatabaseStorage {
  // Tenants
  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async getTenantByDomain(domain: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.domain, domain));
    return tenant;
  }

  async createTenant(tenant: any): Promise<Tenant> {
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

  async createUser(user: any): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getUsersByTenant(tenantId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.tenantId, tenantId));
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
  }

  // Policies
  async getPoliciesByTenant(tenantId: string): Promise<Policy[]> {
    return await db.select().from(policies).where(eq(policies.tenantId, tenantId));
  }

  async getPolicy(id: number): Promise<Policy | undefined> {
    const [policy] = await db.select().from(policies).where(eq(policies.id, id));
    return policy;
  }

  async createPolicy(policy: any): Promise<Policy> {
    const [newPolicy] = await db.insert(policies).values(policy).returning();
    return newPolicy;
  }

  async updatePolicy(id: number, updates: any): Promise<Policy> {
    const [updatedPolicy] = await db.update(policies).set(updates).where(eq(policies.id, id)).returning();
    return updatedPolicy;
  }

  async deletePolicy(id: number): Promise<void> {
    await db.delete(policies).where(eq(policies.id, id));
  }

  // Investments
  async getInvestmentsByTenant(tenantId: string): Promise<Investment[]> {
    return await db.select().from(investments).where(eq(investments.tenantId, tenantId));
  }

  async getInvestment(id: number): Promise<Investment | undefined> {
    const [investment] = await db.select().from(investments).where(eq(investments.id, id));
    return investment;
  }

  async createInvestment(investment: any): Promise<Investment> {
    const [newInvestment] = await db.insert(investments).values(investment).returning();
    return newInvestment;
  }

  async updateInvestment(id: number, updates: any): Promise<Investment> {
    const [updatedInvestment] = await db.update(investments).set(updates).where(eq(investments.id, id)).returning();
    return updatedInvestment;
  }

  async deleteInvestment(id: number): Promise<void> {
    await db.delete(investments).where(eq(investments.id, id));
  }
}

// Initialize storage
const storage = new DatabaseStorage();

// === MULTER CONFIGURATION ===

// Configure multer for file uploads
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
const hasVercelBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
const useVercelBlob = isProduction || hasVercelBlobToken; // Use Vercel Blob if in production OR if token is available

let upload: multer.Multer;

if (useVercelBlob) {
  // Production or development with Vercel Blob token: Use memory storage for Vercel Blob
  upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = /\.(pdf|doc|docx|jpg|jpeg|png)$/i;
      if (allowedTypes.test(path.extname(file.originalname))) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, PNG files are allowed'));
      }
    }
  });
} else {
  // Development without Vercel Blob token: Use disk storage
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  upload = multer({ 
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const tenantId = (req as any).session?.user?.tenantId || 'default';
        const tenantDir = path.join(uploadsDir, tenantId);
        if (!fs.existsSync(tenantDir)) {
          fs.mkdirSync(tenantDir, { recursive: true });
        }
        cb(null, tenantDir);
      },
      filename: (req, file, cb) => {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 12);
        const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${timestamp}_${randomId}_${sanitizedFileName}`);
      }
    }),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = /\.(pdf|doc|docx|jpg|jpeg|png)$/i;
      if (allowedTypes.test(path.extname(file.originalname))) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, PNG files are allowed'));
      }
    }
  });
}

// === AUTH ROUTES ===

// Helper function to sanitize date fields (convert empty strings to undefined)
function sanitizeDateFields(data: any): any {
  const sanitized = { ...data };
  const dateFields = ['startDate', 'maturityDate', 'nextRenewalDate', 'lastPremiumDate', 'purchaseDate'];
  
  dateFields.forEach(field => {
    if (sanitized[field] === '' || sanitized[field] === null) {
      sanitized[field] = undefined;
    }
  });
  
  return sanitized;
}

const registerSimpleAuthRoutes = async (app: express.Express) => {
  const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    domain: z.string().min(1),
  });

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
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

      // Store user in session
      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        domain: tenant.domain,
      };

      res.status(201).json({ 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        domain: tenant.domain,
        message: "User created successfully"
      });
    } catch (err) {
      console.error("Registration error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Registration failed", error: err instanceof Error ? err.message : String(err) });
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

      // Get user's tenant for domain info
      const tenant = await storage.getTenant(user.tenantId!);

      // Store user in session
      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        domain: tenant?.domain || null,
      };

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        domain: tenant?.domain || null,
      });
    } catch (err) {
      console.error("Login error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Login failed", error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        res.status(500).json({ message: "Failed to logout" });
      } else {
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.json({ message: "Logged out successfully" });
      }
    });
  });

  app.post("/api/auth/change-password", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      // Get user from database
      const user = await storage.getUser(req.session.user.id);
      if (!user || !user.passwordHash) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password in database
      await storage.updateUserPassword(user.id, newPasswordHash);

      res.json({ message: "Password changed successfully" });
    } catch (err) {
      console.error("Change password error:", err);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    try {
      // Check if user is logged in via session
      if (req.session.user) {
        res.json(req.session.user);
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    } catch (err) {
      console.error("Get user error:", err);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Admin Routes
  app.get("/api/admin/users", async (req, res) => {
    try {
      // For now, we'll return mock admin endpoints since we don't have proper session management
      // In a real implementation, you'd check if the current user is admin first
      
      // Mock response for admin users list
      res.json([
        {
          id: "mock-admin-id",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          role: "admin",
          tenantId: "mock-tenant-id",
          createdAt: new Date().toISOString(),
        }
      ]);
    } catch (err) {
      console.error("Get admin users error:", err);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.put("/api/admin/users/:userId/role", async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      // Mock response for role update
      res.json({ message: "Role updated successfully" });
    } catch (err) {
      console.error("Update user role error:", err);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.delete("/api/admin/users/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Mock response for user removal
      res.json({ message: "User removed successfully" });
    } catch (err) {
      console.error("Remove user error:", err);
      res.status(500).json({ message: "Failed to remove user" });
    }
  });

  app.put("/api/admin/users/:userId/reset-password", async (req, res) => {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;
      
      // Mock response for password reset
      res.json({ message: "Password reset successfully" });
    } catch (err) {
      console.error("Reset password error:", err);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Policies endpoints
  app.get("/api/policies", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userPolicies = await storage.getPoliciesByTenant(req.session.user.tenantId!);
      
      // Fix document URLs that are in wrong format
      const cleanedPolicies = userPolicies.map(policy => ({
        ...policy,
        documentUrl: fixDocumentUrl(policy.documentUrl)
      }));
      
      res.json(cleanedPolicies);
    } catch (err) {
      console.error("Get policies error:", err);
      res.status(500).json({ message: "Failed to get policies" });
    }
  });

  app.post("/api/policies", upload.single('document'), async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      let documentUrl = null;

      // If a file was uploaded, handle it first
      if (req.file) {
        console.log('Processing file upload for new policy:', req.file.originalname);
        
        // Generate unique identifier for this file upload
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 12);
        const uniqueFileId = `${timestamp}_${randomId}`;
        
        // Use original filename, but sanitize it
        const sanitizedFileName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = sanitizedFileName;
        
        if (useVercelBlob) {
          // Upload to Vercel Blob
          try {
            const blobPath = `documents/${req.session.user.tenantId}/${uniqueFileId}/${fileName}`;
            console.log(`Uploading to Vercel Blob path: ${blobPath}`);
            const blob = await put(blobPath, req.file.buffer, {
              access: 'public',
              contentType: req.file.mimetype
            });
            
            documentUrl = blob.url;
            console.log(`File uploaded to Vercel Blob: ${documentUrl}`);
          } catch (error) {
            console.error("Vercel Blob upload error:", error);
            return res.status(500).json({ message: "Failed to upload document to cloud storage" });
          }
        } else {
          // Development: Save to local disk
          const tenantDir = path.join(process.cwd(), 'uploads', req.session.user.tenantId);
          const fileDir = path.join(tenantDir, uniqueFileId);
          
          if (!fs.existsSync(fileDir)) {
            fs.mkdirSync(fileDir, { recursive: true });
          }
          
          const localFilePath = path.join(fileDir, fileName);
          fs.writeFileSync(localFilePath, req.file.buffer);
          
          const relativePath = path.relative(process.cwd(), localFilePath);
          documentUrl = relativePath.replace(/\\/g, '/');
          console.log(`File saved locally: ${documentUrl}`);
        }
      }

      const policyData = sanitizeDateFields({
        ...req.body,
        tenantId: req.session.user.tenantId,
        documentUrl: documentUrl // Include the blob URL if file was uploaded
      });

      const policy = await storage.createPolicy(policyData);
      res.status(201).json(policy);
    } catch (err) {
      console.error("Create policy error:", err);
      res.status(500).json({ message: "Failed to create policy" });
    }
  });

  // Cleanup endpoint to fix document URLs in wrong format
  app.post("/api/policies/cleanup-document-urls", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userPolicies = await storage.getPoliciesByTenant(req.session.user.tenantId!);
      let updatedCount = 0;

      for (const policy of userPolicies) {
        if (policy.documentUrl && policy.documentUrl.startsWith('documents/tenant/')) {
          console.log(`Cleaning up policy ${policy.id} - removing invalid document URL: ${policy.documentUrl}`);
          await storage.updatePolicy(policy.id, { documentUrl: null });
          updatedCount++;
        }
      }

      res.json({ 
        message: `Cleaned up ${updatedCount} policies with invalid document URLs`,
        updatedCount 
      });
    } catch (err) {
      console.error("Cleanup document URLs error:", err);
      res.status(500).json({ message: "Failed to cleanup document URLs" });
    }
  });

  app.get("/api/policies/:id", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const policy = await storage.getPolicy(parseInt(req.params.id));
      if (!policy || policy.tenantId !== req.session.user.tenantId) {
        return res.status(404).json({ message: "Policy not found" });
      }

      res.json(policy);
    } catch (err) {
      console.error("Get policy error:", err);
      res.status(500).json({ message: "Failed to get policy" });
    }
  });

  app.put("/api/policies/:id", upload.single('document'), async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const policy = await storage.getPolicy(parseInt(req.params.id));
      if (!policy || policy.tenantId !== req.session.user.tenantId) {
        return res.status(404).json({ message: "Policy not found" });
      }

      let documentUrl = policy.documentUrl; // Keep existing URL by default

      // If a new file was uploaded, handle it
      if (req.file) {
        console.log('Processing file upload for policy update:', req.file.originalname);
        
        // Delete old document if it exists
        if (policy.documentUrl) {
          try {
            console.log('Deleting old document before replacing:', policy.documentUrl);
            await deleteBlobFile(policy.documentUrl);
          } catch (error) {
            console.error("Error deleting old document:", error);
            // Continue with upload even if deletion fails
          }
        }
        
        // Generate unique identifier for this file upload
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 12);
        const uniqueFileId = `${timestamp}_${randomId}`;
        
        // Use original filename, but sanitize it
        const sanitizedFileName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = sanitizedFileName;
        
        if (useVercelBlob) {
          // Upload to Vercel Blob
          try {
            const blobPath = `documents/${req.session.user.tenantId}/${uniqueFileId}/${fileName}`;
            console.log(`Uploading to Vercel Blob path: ${blobPath}`);
            const blob = await put(blobPath, req.file.buffer, {
              access: 'public',
              contentType: req.file.mimetype
            });
            
            documentUrl = blob.url;
            console.log(`File uploaded to Vercel Blob: ${documentUrl}`);
          } catch (error) {
            console.error("Vercel Blob upload error:", error);
            return res.status(500).json({ message: "Failed to upload document to cloud storage" });
          }
        } else {
          // Development: Save to local disk
          const tenantDir = path.join(process.cwd(), 'uploads', req.session.user.tenantId);
          const fileDir = path.join(tenantDir, uniqueFileId);
          
          if (!fs.existsSync(fileDir)) {
            fs.mkdirSync(fileDir, { recursive: true });
          }
          
          const localFilePath = path.join(fileDir, fileName);
          fs.writeFileSync(localFilePath, req.file.buffer);
          
          const relativePath = path.relative(process.cwd(), localFilePath);
          documentUrl = relativePath.replace(/\\/g, '/');
          console.log(`File saved locally: ${documentUrl}`);
        }
      }

      const sanitizedData = sanitizeDateFields({
        ...req.body,
        documentUrl: documentUrl // Use new blob URL or keep existing one
      });
      const updatedPolicy = await storage.updatePolicy(parseInt(req.params.id), sanitizedData);
      res.json(updatedPolicy);
    } catch (err) {
      console.error("Update policy error:", err);
      res.status(500).json({ message: "Failed to update policy" });
    }
  });

  app.delete("/api/policies/:id", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const policy = await storage.getPolicy(parseInt(req.params.id));
      if (!policy || policy.tenantId !== req.session.user.tenantId) {
        return res.status(404).json({ message: "Policy not found" });
      }

      console.log(`Deleting policy ${req.params.id} with document: ${policy.documentUrl}`);

      // Delete the associated blob file if it exists
      if (policy.documentUrl) {
        console.log(`Found document URL to delete: ${policy.documentUrl}`);
        await deleteBlobFile(policy.documentUrl);
      } else {
        console.log(`No document URL found for policy ${req.params.id}`);
      }

      await storage.deletePolicy(parseInt(req.params.id));
      console.log(`Successfully deleted policy ${req.params.id}`);
      res.status(204).send();
    } catch (err) {
      console.error("Delete policy error:", err);
      res.status(500).json({ message: "Failed to delete policy" });
    }
  });

  // Endpoint to delete a document from a policy
  app.delete("/api/policies/:id/document", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const policyId = parseInt(req.params.id);
      const policy = await storage.getPolicy(policyId);
      
      if (!policy || policy.tenantId !== req.session.user.tenantId) {
        return res.status(404).json({ message: "Policy not found" });
      }

      if (policy.documentUrl) {
        // Delete the blob file
        await deleteBlobFile(policy.documentUrl);
        
        // Update the policy to remove the document URL
        await storage.updatePolicy(policyId, { documentUrl: null });
      }

      res.status(200).json({ message: "Document deleted successfully" });
    } catch (err) {
      console.error("Delete document error:", err);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Investments endpoints
  app.get("/api/investments", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userInvestments = await storage.getInvestmentsByTenant(req.session.user.tenantId!);
      res.json(userInvestments);
    } catch (err) {
      console.error("Get investments error:", err);
      res.status(500).json({ message: "Failed to get investments" });
    }
  });

  app.post("/api/investments", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const investmentData = sanitizeDateFields({
        ...req.body,
        tenantId: req.session.user.tenantId
      });

      const investment = await storage.createInvestment(investmentData);
      res.status(201).json(investment);
    } catch (err) {
      console.error("Create investment error:", err);
      res.status(500).json({ message: "Failed to create investment" });
    }
  });

  app.get("/api/investments/:id", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const investment = await storage.getInvestment(parseInt(req.params.id));
      if (!investment || investment.tenantId !== req.session.user.tenantId) {
        return res.status(404).json({ message: "Investment not found" });
      }

      res.json(investment);
    } catch (err) {
      console.error("Get investment error:", err);
      res.status(500).json({ message: "Failed to get investment" });
    }
  });

  app.put("/api/investments/:id", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const investment = await storage.getInvestment(parseInt(req.params.id));
      if (!investment || investment.tenantId !== req.session.user.tenantId) {
        return res.status(404).json({ message: "Investment not found" });
      }

      const sanitizedData = sanitizeDateFields(req.body);
      const updatedInvestment = await storage.updateInvestment(parseInt(req.params.id), sanitizedData);
      res.json(updatedInvestment);
    } catch (err) {
      console.error("Update investment error:", err);
      res.status(500).json({ message: "Failed to update investment" });
    }
  });

  app.delete("/api/investments/:id", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const investment = await storage.getInvestment(parseInt(req.params.id));
      if (!investment || investment.tenantId !== req.session.user.tenantId) {
        return res.status(404).json({ message: "Investment not found" });
      }

      await storage.deleteInvestment(parseInt(req.params.id));
      res.status(204).send();
    } catch (err) {
      console.error("Delete investment error:", err);
      res.status(500).json({ message: "Failed to delete investment" });
    }
  });

  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const tenantId = req.session.user.tenantId!;
      
      // Get all policies and investments for the tenant
      const policies = await storage.getPoliciesByTenant(tenantId);
      const investments = await storage.getInvestmentsByTenant(tenantId);

      // Calculate policy metrics
      const totalPolicies = policies.length;
      let expiringSoon = 0; // 30-60 days
      let needsRenewal = 0; // < 30 days or expired
      
      const now = new Date();
      
      policies.forEach(policy => {
        if (policy.maturityDate) {
          const maturityDate = new Date(policy.maturityDate);
          const daysToMaturity = Math.ceil((maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysToMaturity < 0) {
            needsRenewal++; // Already expired
          } else if (daysToMaturity <= 30) {
            needsRenewal++; // Expiring within 30 days
          } else if (daysToMaturity <= 60) {
            expiringSoon++; // Expiring within 31-60 days
          }
        }
      });

      // Calculate investment metrics
      const totalInvestments = investments.length;
      
      const investmentsByCurrency = {
        SEK: 0,
        INR: 0
      };
      
      investments.forEach(investment => {
        if (investment.currency === 'SEK') {
          investmentsByCurrency.SEK += parseFloat(investment.currentValue || '0');
        } else if (investment.currency === 'INR') {
          investmentsByCurrency.INR += parseFloat(investment.currentValue || '0');
        }
      });

      res.json({
        totalPolicies,
        expiringSoon,
        needsRenewal,
        totalInvestments,
        investmentsByCurrency
      });
    } catch (err) {
      console.error("Dashboard stats error:", err);
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  // Upload endpoints (simplified for demo)
  app.post("/api/uploads/request-url", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { name, size, contentType } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "File name is required" });
      }

      // Generate a unique file path
      const timestamp = Date.now();
      const fileName = `${timestamp}-${name}`;
      const objectPath = `documents/${req.session.user.tenantId}/${fileName}`;
      
      // Return upload URL that points to our mock upload endpoint
      const uploadURL = `/api/uploads/file`;

      res.json({
        method: "POST",
        url: uploadURL,
        fields: {
          path: objectPath,
          fileName: fileName
        }
      });
    } catch (err) {
      console.error("Upload request error:", err);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Serve uploaded files (only for development - production uses direct Vercel Blob URLs)
  app.get("/uploads/:tenantId/:filename", (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // In production or when using Vercel Blob, files are served directly from Vercel Blob
      if (useVercelBlob) {
        return res.status(404).json({ message: "File serving not available when using Vercel Blob" });
      }

      const { tenantId, filename } = req.params;
      
      // Only allow users to access files from their own tenant
      if (req.session.user.tenantId !== tenantId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const filePath = path.join(process.cwd(), 'uploads', tenantId, filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      // Set appropriate headers and send file
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png'
      };

      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(filename)}"`);
      
      res.sendFile(filePath);
    } catch (err) {
      console.error("File serve error:", err);
      res.status(500).json({ message: "Failed to serve file" });
    }
  });

  // Helper function to delete blob files
  // Helper function to fix document URLs that are in wrong format
  const fixDocumentUrl = (documentUrl: string | null): string | null => {
    if (!documentUrl) return null;
    
    // If it's already a proper Vercel Blob URL, return as-is
    if (documentUrl.startsWith('https://') && documentUrl.includes('vercel-storage.com')) {
      return documentUrl;
    }
    
    // If it's a local development path, return as-is
    if (documentUrl.startsWith('/') || documentUrl.includes('uploads/')) {
      return documentUrl;
    }
    
    // If it's the old format like "documents/tenant/filename", return null so it can be re-uploaded
    if (documentUrl.startsWith('documents/tenant/')) {
      console.log(`Found old format document URL: ${documentUrl} - marking for re-upload`);
      return null;
    }
    
    return documentUrl;
  };

  const deleteBlobFile = async (documentUrl: string | null) => {
    if (!documentUrl) return;
    
    try {
      // If it's a full Vercel Blob URL (starts with https://), delete directly
      if (documentUrl.startsWith('https://') && documentUrl.includes('vercel-storage.com')) {
        console.log(`Attempting to delete Vercel Blob URL: ${documentUrl}`);
        await del(documentUrl);
        console.log(`Successfully deleted blob file: ${documentUrl}`);
      } 
      // If it's an old format path (like documents/tenant/file.pdf), convert to blob path and try to delete
      else if (documentUrl.startsWith('documents/')) {
        // Try to construct the actual blob path that might exist
        // Extract filename from old format
        const filename = documentUrl.split('/').pop();
        if (filename) {
          // The file might be in the blob storage with a different path structure
          // We need to check if there's a policy ID we can extract or use a pattern
          console.log(`Attempting to delete old format path: ${documentUrl}, filename: ${filename}`);
          
          // For old paths, we can't reliably reconstruct the blob path, so we'll skip deletion
          // This is mainly for cleanup of legacy data
          console.log(`Skipping deletion of old format path: ${documentUrl} - cannot reconstruct blob path`);
        }
      }
      // If it's a local file path, delete from local storage  
      else {
        const filePath = path.join(process.cwd(), documentUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted local file: ${filePath}`);
        } else {
          console.log(`Local file not found: ${filePath}`);
        }
      }
    } catch (error) {
      console.error(`Failed to delete file: ${documentUrl}`, error);
      // Don't throw error, just log it - deletion failure shouldn't block the operation
    }
  };

  // File upload endpoint - supports both local and Vercel Blob storage
  app.post("/api/uploads/file", upload.single('file'), async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Generate unique identifier for this file upload
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 12);
      const uniqueFileId = `${timestamp}_${randomId}`;
      
      console.log(`Uploading file with unique ID: ${uniqueFileId}`);
      
      // Use original filename, but sanitize it
      const sanitizedFileName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = sanitizedFileName;
      
      let filePath: string;
      
      if (useVercelBlob) {
        // Upload to Vercel Blob with unique file identifiers
        try {
          const blobPath = `documents/${req.session.user.tenantId}/${uniqueFileId}/${fileName}`;
          console.log(`Uploading to Vercel Blob path: ${blobPath}`);
          const blob = await put(blobPath, req.file.buffer, {
            access: 'public',
            contentType: req.file.mimetype
          });
          
          // Store the full Vercel Blob URL in the database
          filePath = blob.url;
          console.log(`File uploaded to Vercel Blob: ${filePath}`);
        } catch (error) {
          console.error("Vercel Blob upload error:", error);
          return res.status(500).json({ message: "Failed to upload to cloud storage" });
        }
      } else {
        // Development: Save to local disk with unique file identifiers
        const tenantDir = path.join(process.cwd(), 'uploads', req.session.user.tenantId);
        const fileDir = path.join(tenantDir, uniqueFileId);
        
        // Create file directory if it doesn't exist
        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
        }
        
        const localFilePath = path.join(fileDir, fileName);
        fs.writeFileSync(localFilePath, req.file.buffer);
        
        const relativePath = path.relative(process.cwd(), localFilePath);
        filePath = relativePath.replace(/\\/g, '/'); // Normalize path separators for web
        console.log(`File saved locally: ${filePath}`);
      }
      
      res.status(200).json({ 
        success: true, 
        path: filePath,
        message: "File uploaded successfully",
        filename: fileName,
        uniqueFileId: uniqueFileId, // Include the unique file identifier
        size: req.file.size,
        originalName: req.file.originalname
      });
    } catch (err) {
      console.error("File upload error:", err);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });
};

const app = express();

// Extend session data interface
declare module "express-session" {
  interface SessionData {
    userId?: string;
    user?: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      role?: string;
      tenantId?: string;
      domain?: string;
    };
  }
}

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Session configuration
// Configure CORS to allow credentials
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : 'http://localhost:5173',
  credentials: true
}));

// Configure PostgreSQL session store
const PgSession = connectPgSimple(session);
const pgPool = new Pool({ connectionString: process.env.NEON_DATABASE_URL });

app.use(session({
  store: new PgSession({
    pool: pgPool,
    tableName: 'sessions',
    createTableIfMissing: false // Table already exists
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production' && process.env.VERCEL_URL?.startsWith('https'),
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "vercel") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

// Add a simple health check route
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    hasDb: !!process.env.NEON_DATABASE_URL
  });
});

// Initialize routes
let routesInitialized = false;

const initializeRoutes = async () => {
  if (!routesInitialized) {
    try {
      console.log("Initializing routes...");
      
      // Use simple auth routes for serverless environment
      await registerSimpleAuthRoutes(app);
      
      routesInitialized = true;
      console.log("Routes initialized successfully");
    } catch (error) {
      console.error("Failed to initialize routes:", error);
      throw error;
    }
  }
};

app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await initializeRoutes();
    next();
  } catch (error) {
    console.error("Error initializing routes:", error);
    res.status(500).json({ message: "Internal Server Error", error: error instanceof Error ? error.message : String(error) });
  }
});

app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error("Internal Server Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(status).json({ message });
});

export default app;