"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";

const LOADING_STEPS = [
  "Kết nối dữ liệu",
  "Đồng bộ nhân sự",
  "Tính toán chỉ số",
  "Hoàn tất dashboard",
];

const STEP_PROGRESS = [22, 48, 76, 96];
const STEP_DELAYS = [220, 900, 1780, 2820];

export default function Loading() {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    const timers = STEP_DELAYS.map((delay, index) =>
      setTimeout(() => {
        setStep(index);
        setProgress(STEP_PROGRESS[index]);
      }, delay)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  const progressLabel = useMemo(() => `${progress}%`, [progress]);
  const circumference = 2 * Math.PI * 40;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#f8fafc] px-5 py-10">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-10%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-orange-400/20 blur-[110px]" />
        <div className="absolute bottom-[-15%] right-[-5%] h-[360px] w-[360px] rounded-full bg-amber-300/15 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(90deg, #0f172a 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <main className="relative flex w-full max-w-[400px] flex-col items-center rounded-[28px] border border-slate-200/70 bg-white/90 px-8 py-10 text-center shadow-[0_1px_1px_rgba(15,23,42,0.03),0_24px_64px_-12px_rgba(15,23,42,0.16)] backdrop-blur-xl">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-gradient-to-br from-orange-500 to-amber-400 text-sm font-black text-white shadow-[0_6px_16px_-4px_rgba(249,115,22,0.55)]">
            G
          </div>
          <div className="text-left">
            <div className="text-[0.8rem] font-bold leading-none tracking-tight text-slate-900">
              GHN GTalk
            </div>
            <div className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Adoption Dashboard
            </div>
          </div>
        </div>

        {/* Progress ring */}
        <div className="relative mt-9 h-28 w-28">
          <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90">
            <circle cx="48" cy="48" r="40" fill="none" stroke="#f1f5f9" strokeWidth="7" />
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke="url(#loadingGradient)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress / 100)}
              style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)" }}
            />
            <defs>
              <linearGradient id="loadingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[1.65rem] font-black tabular-nums leading-none tracking-tight text-slate-900">
              {progressLabel}
            </span>
          </div>
        </div>

        <h1 className="mt-7 text-[1.3rem] font-bold leading-snug tracking-tight text-slate-900">
          Đang chuẩn bị dashboard
        </h1>
        <p className="mt-2 text-[0.85rem] leading-relaxed text-slate-500">
          Hệ thống đang tải dữ liệu mới nhất, sẽ hiển thị ngay khi hoàn tất.
        </p>

        {/* Steps */}
        <div className="mt-7 flex w-full flex-col gap-1 rounded-2xl border border-slate-100 bg-slate-50/70 p-2.5">
          {LOADING_STEPS.map((label, index) => {
            const done = index < step;
            const active = index === step;
            return (
              <div
                key={label}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors duration-300 ${
                  active ? "bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]" : ""
                }`}
              >
                <div
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full transition-colors duration-300 ${
                    done
                      ? "bg-orange-500 text-white"
                      : active
                        ? "bg-orange-50 text-orange-500"
                        : "bg-slate-100 text-slate-300"
                  }`}
                >
                  {done ? (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  ) : active ? (
                    <Loader2 className="h-3 w-3 animate-spin" strokeWidth={3} />
                  ) : (
                    <span className="h-1 w-1 rounded-full bg-current" />
                  )}
                </div>
                <span
                  className={`text-[0.8rem] font-semibold transition-colors duration-300 ${
                    active ? "text-slate-900" : done ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-[0.72rem] font-medium text-slate-400">
          Có thể mất vài giây khi đồng bộ từ Google Sheets
        </p>
      </main>
    </div>
  );
}
