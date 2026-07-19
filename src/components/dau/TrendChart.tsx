"use client";
import {
  ComposedChart, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendPoint } from "@/types";

interface TrendChartProps {
  data: TrendPoint[];
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
      minWidth: 160,
    }}>
      <p style={{ fontWeight: 700, marginBottom: 8, color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 4 }}>
          <span style={{ color: p.color, fontWeight: 500 }}>{p.name}</span>
          <strong>{p.dataKey === "pct" ? `${p.value.toFixed(1)}%` : p.value.toLocaleString("vi-VN")}</strong>
        </div>
      ))}
    </div>
  );
};

export default function TrendChart({ data }: TrendChartProps) {
  if (!data.length) return null;

  const msg = data.length >= 2
    ? `Tỷ lệ Active: ${data[0].pct.toFixed(1)}% → ${data[data.length - 1].pct.toFixed(1)}% (${(data[data.length - 1].pct - data[0].pct) >= 0 ? "+" : ""}${(data[data.length - 1].pct - data[0].pct).toFixed(1)}pp) trong ${data.length} kỳ`
    : "";

  return (
    <div className="section">
      <div className="section-title">Xu Hướng Active Theo Thời Gian</div>
      {msg && <div className="section-msg">{msg}</div>}
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 16, right: 56, bottom: 32, left: 8 }}>
          <defs>
            <linearGradient id="gradPct" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.25} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "Inter" }}
            axisLine={{ stroke: "rgba(15,23,42,0.08)" }}
            tickLine={false}
            angle={-40}
            textAnchor="end"
            height={52}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "Inter" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v.toLocaleString("vi-VN")}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "Inter" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.04)" }} />
          <Legend
            wrapperStyle={{ fontSize: "0.82rem", paddingTop: "12px", color: "#64748b" }}
            iconType="circle"
          />
          <Bar
            yAxisId="left"
            dataKey="newUsers"
            name="User mới"
            fill="url(#gradBar)"
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
          />
          <Area
            yAxisId="right"
            dataKey="pct"
            name="% Active"
            type="monotone"
            stroke="#6366f1"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#gradPct)"
            dot={{ fill: "white", stroke: "#6366f1", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "#6366f1", strokeWidth: 2, fill: "white" }}
            label={{
              position: "top",
              formatter: (v: any) => `${v.toFixed(1)}%`,
              style: { fontSize: 10, fill: "#6366f1", fontWeight: 700, fontFamily: "Inter" },
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
