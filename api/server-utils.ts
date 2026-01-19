// Server utilities for Vercel deployment
// This file consolidates server functionality for the serverless environment

import { DatabaseStorage } from "../server/storage";

// Initialize storage
export const storage = new DatabaseStorage();

// Re-export everything needed for the API
export { registerSimpleAuthRoutes } from "../server/simple-auth";
export { registerRoutes } from "../server/routes";