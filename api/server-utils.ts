// Server utilities for Vercel deployment
// This file consolidates server functionality for the serverless environment

import { db } from "../server/db";
import { Storage } from "../server/storage";

// Initialize storage
export const storage = new Storage(db);

// Re-export everything needed for the API
export { registerSimpleAuthRoutes } from "../server/simple-auth";
export { registerRoutes } from "../server/routes";