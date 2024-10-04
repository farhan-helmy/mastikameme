import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DRIZZLE_DATABASE_URL as string,
  },
  verbose: true,
  strict: true,
});
