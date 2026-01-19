import { defineConfig } from "drizzle-kit";

// Use NEON_DATABASE_URL if provided, otherwise fall back to DATABASE_URL
const databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("NEON_DATABASE_URL or DATABASE_URL must be set, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: ["./shared/schema.ts", "./shared/models/auth.ts"],
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
