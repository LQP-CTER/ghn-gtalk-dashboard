import { Pool } from "pg";

declare global {
  var __gtalkDashboardPool: Pool | undefined;
}

export const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!global.__gtalkDashboardPool) {
    global.__gtalkDashboardPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  return global.__gtalkDashboardPool;
}

export async function readSnapshot<T>(source: string): Promise<T | null> {
  if (!hasDatabaseUrl) return null;

  const result = await getPool().query<{ data: T }>(
    "select data from dashboard_snapshots where source = $1 limit 1",
    [source]
  );

  return result.rows[0]?.data ?? null;
}
