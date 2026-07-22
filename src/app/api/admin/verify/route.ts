import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getConfiguredCode() {
  return process.env.ADMIN_ACCESS_CODE?.trim() || "";
}

export async function POST(request: Request) {
  const configuredCode = getConfiguredCode();
  if (!configuredCode) {
    return NextResponse.json(
      { ok: false, error: "Admin access code is not configured." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const code = String(body?.code || "").trim();

  if (!code || code !== configuredCode) {
    return NextResponse.json(
      { ok: false, error: "Mã truy cập không đúng." },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
