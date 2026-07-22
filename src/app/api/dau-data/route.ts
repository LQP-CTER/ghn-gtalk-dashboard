import { NextResponse } from "next/server";
import { readSnapshot } from "@/lib/db";
import type { Employee } from "@/types";

type DauSnapshot = {
  employees: Employee[];
  activeByDate: Record<string, number[]>;
  allDates: string[];
};

export async function GET() {
  const data = await readSnapshot<DauSnapshot>("dau_tracking").catch(() => null);

  if (!data) {
    return NextResponse.json(
      { error: "DAU data snapshot is not available" },
      { status: 503 }
    );
  }

  return NextResponse.json(data);
}
