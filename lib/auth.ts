// Google sign-in (Better Auth). Server-side only.
// Accounts and sessions live in db/auth.db, separate from the stats DB, so re-seeding stats never logs anyone out.
// Needs in .env.local: BETTER_AUTH_SECRET, BETTER_AUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET.
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import Database from "better-sqlite3";
import path from "path";

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

/** False until the Google credentials are in .env.local; the UI then shows sign-in as "not set up yet". */
export const googleConfigured = Boolean(clientId && clientSecret);

const options = {
  database: new Database(process.env.AUTH_DB_PATH ?? path.join(process.cwd(), "db", "auth.db")),
  socialProviders: googleConfigured
    ? { google: { clientId: clientId!, clientSecret: clientSecret!, prompt: "select_account" } }
    : {},
  telemetry: { enabled: false },
} satisfies BetterAuthOptions;

const createAuth = () => betterAuth(options);
let instance: Promise<ReturnType<typeof createAuth>> | null = null;

/**
 * The Better Auth instance. Created on first use, after its tables exist in db/auth.db
 * (Better Auth checks the schema when it starts, so the tables have to be there first).
 */
export function getAuth() {
  instance ??= getMigrations(options)
    .then((m) => m.runMigrations())
    .then(createAuth);
  return instance;
}
