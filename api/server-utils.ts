// Server utilities for Vercel deployment
// This file consolidates server functionality for the serverless environment

import { db } from "./db";
import { DatabaseStorage } from "../server/storage";

// Initialize storage
export const storage = new DatabaseStorage(db);

// Re-export everything needed for the API
export { registerSimpleAuthRoutes } from "../server/simple-auth";
export { registerRoutes } from "../server/routes";