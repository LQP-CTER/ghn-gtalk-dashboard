import { NextResponse } from "next/server";
import { readSnapshot, readSnapshotUpdatedAt, upsertSnapshot } from "@/lib/db";
import {
  DashboardImportTarget,
  ImportSnapshot,
  mergeActiveUpload,
  parseActiveUpload,
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

function isDashboardTarget(value: FormDataEntryValue | null): value is DashboardImportTarget {
  return value === "gtalk_download" || value === "dau_tracking";
}

export async function POST(request: Request) {
  const auth = requireAdminCode(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const formData = await request.formData();
    const targetValue = formData.get("target");
    const confirmedTarget = String(formData.get("confirmedTarget") || "");
    const dateInput = String(formData.get("date") || "");
    const fileValue = formData.get("file");

    if (!isDashboardTarget(targetValue)) {
      return NextResponse.json({ error: "Vui lòng chọn dashboard cần cập nhật." }, { status: 400 });
    }

    if (confirmedTarget !== DASHBOARD_LABELS[targetValue]) {
      return NextResponse.json(
        { error: `Vui lòng xác nhận chính xác tên dashboard: ${DASHBOARD_LABELS[targetValue]}.` },
        { status: 400 }
      );
    }

    if (!(fileValue instanceof File)) {
      return NextResponse.json({ error: "Vui lòng chọn file CSV để upload." }, { status: 400 });
    }

    if (!fileValue.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json({ error: "Chỉ hỗ trợ file CSV." }, { status: 400 });
    }

    const csvText = await fileValue.text();
    const parsed = parseActiveUpload(csvText, dateInput);
    if (parsed.activeCount === 0 || parsed.allDates.length === 0) {
      return NextResponse.json({ error: "File không có employee_id hợp lệ để import." }, { status: 400 });
    }

    const current = await readSnapshot<ImportSnapshot>(targetValue);
    const nextSnapshot = mergeActiveUpload(targetValue, current, parsed);
    await upsertSnapshot(targetValue, nextSnapshot);
    const updatedAt = await readSnapshotUpdatedAt(targetValue);

    return NextResponse.json({
      ok: true,
      dashboard: DASHBOARD_LABELS[targetValue],
      source: targetValue,
      fileName: fileValue.name,
      inputMode: parsed.inputMode,
      importedRows: parsed.rowCount,
      importedActiveUsers: parsed.activeCount,
      importedDates: parsed.allDates,
      totalDates: nextSnapshot.allDates.length,
      updatedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import thất bại.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
