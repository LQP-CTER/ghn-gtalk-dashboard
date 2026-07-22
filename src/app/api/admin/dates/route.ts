import { NextResponse } from "next/server";
import { readSnapshot } from "@/lib/db";
import { DashboardImportTarget, ImportSnapshot } from "@/lib/dashboardImport";

export const dynamic = "force-dynamic";

const DASHBOARD_LABELS: Record<DashboardImportTarget, string> = {
  gtalk_download: "Gtalk Download",
  dau_tracking: "DAU",
};

function requireAdminCode(request: Request) {
  const configuredCode = process.env.ADMIN_ACCESS_CODE?.trim() || "";
  if (!configuredCode) {
    return { ok: false, status: 503, error: "Admin access code is not configured." } as const;
  }

  const code = request.headers.get("x-admin-code")?.trim() || "";
  if (code !== configuredCode) {
    return { ok: false, status: 401, error: "Mã truy cập không hợp lệ." } as const;
  }

  return { ok: true } as const;
}

function isDashboardTarget(value: string | null): value is DashboardImportTarget {
  return value === "gtalk_download" || value === "dau_tracking";
}

export async function GET(request: Request) {
  const auth = requireAdminCode(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const target = searchParams.get("target");
  if (!isDashboardTarget(target)) {
    return NextResponse.json({ error: "Vui lòng chọn dashboard cần xem ngày." }, { status: 400 });
  }

  const snapshot = await readSnapshot<ImportSnapshot>(target);
  const allDates = snapshot?.allDates || [];
  return NextResponse.json({
    ok: true,
    source: target,
    dashboard: DASHBOARD_LABELS[target],
    dates: [...allDates].reverse(),
  });
}
