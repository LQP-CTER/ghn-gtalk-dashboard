import { NextResponse } from "next/server";
import { readSnapshot, readSnapshotUpdatedAt, upsertSnapshot } from "@/lib/db";
import {
  DashboardImportTarget,
  ImportSnapshot,
  removeDateFromSnapshot,
} from "@/lib/dashboardImport";

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

function isDashboardTarget(value: unknown): value is DashboardImportTarget {
  return value === "gtalk_download" || value === "dau_tracking";
}

export async function POST(request: Request) {
  const auth = requireAdminCode(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const target = body?.target;
    const date = String(body?.date || "");
    const confirmedTarget = String(body?.confirmedTarget || "");
    const confirmedDate = String(body?.confirmedDate || "");

    if (!isDashboardTarget(target)) {
      return NextResponse.json({ error: "Vui lòng chọn dashboard cần xóa dữ liệu." }, { status: 400 });
    }

    if (confirmedTarget !== DASHBOARD_LABELS[target]) {
      return NextResponse.json(
        { error: `Vui lòng xác nhận chính xác tên dashboard: ${DASHBOARD_LABELS[target]}.` },
        { status: 400 }
      );
    }

    if (!date || confirmedDate !== date) {
      return NextResponse.json(
        { error: "Vui lòng xác nhận chính xác ngày cần xóa." },
        { status: 400 }
      );
    }

    const current = await readSnapshot<ImportSnapshot>(target);
    const { snapshot, removedDate, removedUsers } = removeDateFromSnapshot(target, current, date);
    await upsertSnapshot(target, snapshot);
    const updatedAt = await readSnapshotUpdatedAt(target);

    return NextResponse.json({
      ok: true,
      dashboard: DASHBOARD_LABELS[target],
      source: target,
      removedDate,
      removedUsers,
      totalDates: snapshot.allDates.length,
      updatedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Xóa dữ liệu thất bại.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
