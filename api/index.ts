import express, { type Request, Response, NextFunction } from "express";
// Import everything directly to avoid module resolution issues in Vercel
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";
import { DatabaseStorage } from "../server/storage";
import { registerSimpleAuthRoutes } from "../server/simple-auth";

const { Pool } = pg;

// Database setup
const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or NEON_DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema });

// Initialize storage
const storage = new DatabaseStorage();

const app = express();

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

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