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

export async function ensureSnapshotSchema() {
  await getPool().query(`
    create table if not exists dashboard_snapshots (
      source text primary key,
      data jsonb not null,
      updated_at timestamptz not null default now()
    );
  `);
}

export async function upsertSnapshot(source: string, data: unknown) {
  await ensureSnapshotSchema();
  await getPool().query(
    `
      insert into dashboard_snapshots (source, data, updated_at)
      values ($1, $2::jsonb, now())
      on conflict (source)
      do update set data = excluded.data, updated_at = now();
    `,
    [source, JSON.stringify(data)]
  );
}

export async function readSnapshotUpdatedAt(source: string): Promise<string | null> {
  if (!hasDatabaseUrl) return null;

  const result = await getPool().query<{ updated_at: Date }>(
    "select updated_at from dashboard_snapshots where source = $1 limit 1",
    [source]
  );

  return result.rows[0]?.updated_at?.toISOString() ?? null;
}
