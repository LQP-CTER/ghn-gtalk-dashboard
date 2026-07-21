"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { DivisionRow } from "@/types";

interface DivisionChartProps {
  data: DivisionRow[];
  selectedDate: string;
  prevDate: string | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "white",
      border: "1px solid rgba(15,23,42,0.08)",
      borderRadius: "10px",
      padding: "12px 16px",
      fontSize: "0.83rem",
      color: "#0f172a",
      boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
      minWidth: 200,
    }}>
      <p style={{ fontWeight: 700, marginBottom: 8, color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 4 }}>
          <span style={{ color: p.color, fontWeight: 500 }}>{p.name}</span>
          <strong>{p.value.toFixed(1)}%</strong>
        </div>
      ))}
    </div>
  );
};

export default function DivisionChart({ data, selectedDate, prevDate }: DivisionChartProps) {
  if (!data.length) return null;

  const sorted = [...data].sort((a, b) => a.pctCurr - b.pctCurr);
  const top = [...data].sort((a, b) => b.pctCurr - a.pctCurr)[0];
  const bottom = [...data].sort((a, b) => a.pctCurr - b.pctCurr)[0];
  const msg = `Cao nhất: ${top?.name} (${top?.pctCurr.toFixed(1)}%) · Thấp nhất: ${bottom?.name} (${bottom?.pctCurr.toFixed(1)}%)`;

  return (
    <div className="section">
      <div className="section-title">Phân Tích Theo Khối</div>
      <div className="section-msg">{msg}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: "24px", alignItems: "start" }}>
        {/* Chart - compact */}
        <div>
          <ResponsiveContainer width="100%" height={Math.max(220, sorted.length * 36)}>
            <BarChart
              layout="vertical"
              data={sorted}
              margin={{ top: 4, right: 40, bottom: 4, left: 10 }}
            >
              <defs>
                <linearGradient id="gradCurr" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#fb923c" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="gradPrev" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#e2e8f0" stopOpacity={1} />
                  <stop offset="100%" stopColor="#cbd5e1" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal={false} stroke="rgba(15,23,42,0.05)" />
              <XAxis
                type="number" domain={[0, 100]}
                tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "Inter" }}
                tickFormatter={(v) => `${v}%`}
                axisLine={false} tickLine={false}
              />
              <YAxis
                type="category" dataKey="name"
                tick={{ fontSize: 10, fill: "#475569", fontFamily: "Inter" }}
                width={90}
                tickFormatter={(v) => v.length > 14 ? v.substring(0, 12) + '…' : v}
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(249,115,22,0.04)" }} />
              {prevDate && (
                <Bar dataKey="pctPrev" name={`Kỳ trước (${prevDate})`} fill="url(#gradPrev)" maxBarSize={10} radius={[0, 3, 3, 0]} />
              )}
              <Bar dataKey="pctCurr" name={`Hiện tại (${selectedDate})`} fill="url(#gradCurr)" maxBarSize={10} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Table - prominent */}
        <div className="ibcs-table-wrap">
          <table className="ibcs-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Khối / Phòng Ban</th>
                <th className="num">HC</th>
                <th className="num">Active</th>
                <th className="num">%</th>
                <th className="num">Thay đổi</th>
              </tr>
            </thead>
            <tbody>
              {[...data].sort((a, b) => b.pctCurr - a.pctCurr).map((r) => (
                <tr key={r.name}>
                  <td style={{ fontWeight: 500, lineHeight: 1.4 }} title={r.name}>{r.name}</td>
                  <td className="num">{r.total.toLocaleString("vi-VN")}</td>
                  <td className="num">{r.activeCurr.toLocaleString("vi-VN")}</td>
                  <td className="num" style={{ fontWeight: 600 }}>{r.pctCurr.toFixed(1)}%</td>
                  <td className={`num ${r.deltaPct > 0 ? "pos" : r.deltaPct < 0 ? "neg" : "neutral"}`}>
                    {r.deltaPct > 0 ? "+" : ""}{r.deltaPct.toFixed(1)}pp
                  </td>
                </tr>
              ))}
              {(() => {
                const t = data.reduce((acc, r) => ({
                  total: acc.total + r.total,
                  activeCurr: acc.activeCurr + r.activeCurr,
                  activePrev: acc.activePrev + r.activePrev,
                }), { total: 0, activeCurr: 0, activePrev: 0 });
                const pct = t.total > 0 ? (t.activeCurr / t.total) * 100 : 0;
                const pctP = t.total > 0 ? (t.activePrev / t.total) * 100 : 0;
                const d = pct - pctP;
                return (
                  <tr className="total-row">
                    <td><strong>TỔNG</strong></td>
                    <td className="num">{t.total.toLocaleString("vi-VN")}</td>
                    <td className="num">{t.activeCurr.toLocaleString("vi-VN")}</td>
                    <td className="num">{pct.toFixed(1)}%</td>
                    <td className={`num ${d > 0 ? "pos" : d < 0 ? "neg" : "neutral"}`}>
                      {d > 0 ? "+" : ""}{d.toFixed(1)}pp
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
