import pg from "pg";
import Papa from "papaparse";

const { Pool } = pg;

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycby47lJymK5vNJpqRx0mS_00YpwTsoLpBDTTBnyxo_Dkrjp3EMlUMwbNV_FMIubm0LG4/exec";

const DAU_SHEET_ID = "1p6cj7feop34eqLNAWNKC1ew8bTA1vl8UUS8e6SISjiY";
const WORKFORCE_URL = `https://docs.google.com/spreadsheets/d/${DAU_SHEET_ID}/export?format=csv&gid=0`;
const USER_ACTIVE_URL = `https://docs.google.com/spreadsheets/d/${DAU_SHEET_ID}/export?format=csv&gid=1300871074`;

function requireDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed NeonDB.");
  }
  return process.env.DATABASE_URL;
}

async function fetchCsv(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch CSV (${res.status})`);
  const text = await res.text();
  const result = Papa.parse(text, { skipEmptyLines: true });
  return result.data;
}

function normalizeDate(raw) {
  const s = String(raw || "").trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const parts = s.split("/");
    return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}`;
  }
  if (/^\d{1,2}\/\d{1,2}$/.test(s)) {
    const parts = s.split("/");
    return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}`;
  }
  if (/^\d{1,2}-\d{1,2}$/.test(s)) {
    const parts = s.split("-");
    return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const parts = s.split("-");
    return `${parts[2]}/${parts[1]}`;
  }
  return s;
}

function parseWorkforce(rows) {
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => String(h || "").trim().toLowerCase().replace(/ /g, "_"));
  const idx = (name) => header.indexOf(name);

  const idxEmpId = idx("employee_id");
  const idxName = idx("employee_name");
  const idxStatus = idx("status");
  const idxJobtitle = idx("jobtitle_name");
  const idxJobtitleVn = idx("jobtitle_name_vn");
  const idxTeam = idx("team_name");
  const idxTeamVn = idx("team_name_vn");
  const idxSection = idx("section_name");
  const idxSectionVn = idx("section_name_vn");
  const idxDept = idx("department_name");
  const idxDeptVn = idx("department_name_vn");
  const idxDiv = idx("division_name");
  const idxDivVn = idx("division_name_vn");
  const idxBu = idx("bu_name");

  return rows.slice(1).flatMap((row) => {
    const empId = parseInt(String(row[idxEmpId] || "0").trim(), 10);
    if (!empId || Number.isNaN(empId)) return [];
    return [{
      employee_id: empId,
      employee_name: String(row[idxName] || "").trim(),
      status: parseInt(String(row[idxStatus] || "0").trim(), 10),
      jobtitle_name: String(row[idxJobtitleVn] || row[idxJobtitle] || "").trim(),
      jobtitle_name_vn: String(row[idxJobtitleVn] || "").trim(),
      team_name: String(row[idxTeamVn] || row[idxTeam] || "").trim(),
      section_name: String(row[idxSectionVn] || row[idxSection] || "").trim(),
      department_name: String(row[idxDeptVn] || row[idxDept] || "").trim(),
      division_name: String(row[idxDivVn] || row[idxDiv] || "").trim(),
      bu_name: String(row[idxBu] || "").trim(),
    }];
  });
}

function parseUserActive(rows) {
  if (rows.length < 1) return {};
  const header = rows[0];
  const activeByDate = {};
  const dateMap = [];

  header.forEach((raw, colIdx) => {
    const value = String(raw || "").trim();
    if (!value) return;
    const dateKey = normalizeDate(value);
    activeByDate[dateKey] ||= new Set();
    dateMap.push({ colIdx, dateKey });
  });

  rows.slice(1).forEach((row) => {
    dateMap.forEach(({ colIdx, dateKey }) => {
      const empId = parseInt(String(row[colIdx] || "").trim(), 10);
      if (!Number.isNaN(empId) && empId > 0) activeByDate[dateKey].add(empId);
    });
  });

  return Object.fromEntries(
    Object.entries(activeByDate).map(([date, ids]) => [date, [...ids]])
  );
}

function sortDates(activeByDate) {
  return Object.keys(activeByDate).sort((a, b) => {
    const toMs = (d) => {
      const [day, month] = d.split("/").map(Number);
      return new Date(2026, month - 1, day).getTime();
    };
    return toMs(a) - toMs(b);
  });
}

async function fetchGtalkDownload() {
  const res = await fetch(APPS_SCRIPT_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Apps Script fetch failed (${res.status})`);
  const data = await res.json();
  return {
    staffList: (data.staffList || []).map((staff) => ({
      ...staff,
      employee_id: Number(staff.employee_id),
    })),
    activeByDate: data.activeByDate || {},
    allDates: data.allDates || [],
  };
}

async function fetchDauTracking() {
  const [workforceRows, userActiveRows] = await Promise.all([
    fetchCsv(WORKFORCE_URL),
    fetchCsv(USER_ACTIVE_URL),
  ]);
  const employees = parseWorkforce(workforceRows);
  const activeByDate = parseUserActive(userActiveRows);
  const allDates = sortDates(activeByDate);
  return { employees, activeByDate, allDates };
}

async function ensureSchema(pool) {
  await pool.query(`
    create table if not exists dashboard_snapshots (
      source text primary key,
      data jsonb not null,
      updated_at timestamptz not null default now()
    );
  `);
}

async function upsertSnapshot(pool, source, data) {
  await pool.query(
    `
      insert into dashboard_snapshots (source, data, updated_at)
      values ($1, $2::jsonb, now())
      on conflict (source)
      do update set data = excluded.data, updated_at = now();
    `,
    [source, JSON.stringify(data)]
  );
}

async function main() {
  const pool = new Pool({
    connectionString: requireDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
    max: 2,
  });

  try {
    await ensureSchema(pool);
    const [gtalkDownload, dauTracking] = await Promise.all([
      fetchGtalkDownload(),
      fetchDauTracking(),
    ]);

    await upsertSnapshot(pool, "gtalk_download", gtalkDownload);
    await upsertSnapshot(pool, "dau_tracking", dauTracking);

    console.log("Seed completed");
    console.log(`Gtalk Download: ${gtalkDownload.staffList.length} staff, ${gtalkDownload.allDates.length} dates`);
    console.log(`DAU Tracking: ${dauTracking.employees.length} employees, ${dauTracking.allDates.length} dates`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
