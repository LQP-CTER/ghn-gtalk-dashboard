"use client";
import type { Metrics } from "@/types";
import { fmtNumber, fmtPct, fmtDelta } from "@/lib/dauDataUtils";
import type { PeriodMetrics } from "@/lib/dauDataUtils";

interface KpiCardsProps {
  curr: Metrics;
  prev: Metrics;
  first: Metrics;
  wau: PeriodMetrics;
  mau: PeriodMetrics;
  selectedDate: string;
  prevDate: string | null;
}

function windowLabel(metric: PeriodMetrics, fallback: string) {
  if (!metric.startDate || !metric.endDate) return fallback;
  if (metric.startDate === metric.endDate) return metric.endDate;
  return `${metric.startDate} → ${metric.endDate}`;
}

export default function KpiCards({ curr, prev, first, wau, mau, selectedDate, prevDate }: KpiCardsProps) {
  const deltaActive = curr.activeCount - prev.activeCount;
  const deltaPct = curr.pct - prev.pct;
  const cumulativeGrowth = curr.pct - first.pct;

  const dActive = fmtDelta(deltaActive);
  const dPct = fmtDelta(deltaPct, true);

  return (
    <div className="kpi-grid dau-kpi-grid">
      {/* Total HC */}
      <div className="kpi-card">
        <div className="kpi-label">Tổng Nhân Sự</div>
        <div className="kpi-value">{fmtNumber(curr.totalHc)}</div>
        <div className="kpi-sub">Tổng headcount trong biên chế</div>
      </div>

      {/* DAU */}
      <div className="kpi-card green">
        <div className="kpi-label">DAU</div>
        <div className="kpi-value">{fmtNumber(curr.activeCount)}</div>
        <div className="kpi-sub">
          User active trong ngày {selectedDate} ·{" "}
          <span className={dActive.cls}>{dActive.text}</span>{" "}
          {prevDate ? `so với ${prevDate}` : ""}
        </div>
      </div>

      {/* WAU */}
      <div className="kpi-card blue">
        <div className="kpi-label">WAU</div>
        <div className="kpi-value">{fmtNumber(wau.activeCount)}</div>
        <div className="kpi-sub">
          Unique user active trong 7 ngày · {fmtPct(wau.pct)} · {windowLabel(wau, "Chưa đủ dữ liệu")}
        </div>
      </div>

      {/* MAU */}
      <div className="kpi-card blue">
        <div className="kpi-label">MAU</div>
        <div className="kpi-value">{fmtNumber(mau.activeCount)}</div>
        <div className="kpi-sub">
          Unique user active trong 30 ngày · {fmtPct(mau.pct)} · {windowLabel(mau, "Chưa đủ dữ liệu")}
        </div>
      </div>

      {/* Not yet */}
      <div className="kpi-card red">
        <div className="kpi-label">Chưa Active</div>
        <div className="kpi-value">{fmtNumber(curr.inactiveCount)}</div>
        <div className="kpi-sub">Chưa active trong ngày {selectedDate}</div>
      </div>

      {/* % */}
      <div className="kpi-card blue">
        <div className="kpi-label">Tỷ Lệ DAU</div>
        <div className="kpi-value">{fmtPct(curr.pct)}</div>
        <div className="kpi-sub">
          Kỳ trước: <span className={dPct.cls}>{dPct.text}</span>{" "}· Tích lũy:{" "}
          <span className={cumulativeGrowth >= 0 ? "pos" : "neg"}>
            {cumulativeGrowth >= 0 ? "+" : ""}{cumulativeGrowth.toFixed(1)}pp
          </span>
        </div>
      </div>
    </div>
  );
}
