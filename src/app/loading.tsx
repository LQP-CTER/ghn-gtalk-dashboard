"use client";
import React, { useEffect, useMemo, useState } from "react";

const LOADING_STEPS = [
  "Kết nối nguồn dữ liệu",
  "Đồng bộ dữ liệu nhân sự",
  "Chuẩn bị chỉ số báo cáo",
  "Hoàn tất dashboard",
];

const STEP_PROGRESS = [24, 52, 78, 96];
const STEP_DELAYS = [220, 920, 1800, 2800];

export default function Loading() {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(14);

  useEffect(() => {
    const timers = STEP_DELAYS.map((delay, index) => setTimeout(() => {
      setStep(index);
      setProgress(STEP_PROGRESS[index]);
    }, delay));

    return () => timers.forEach(clearTimeout);
  }, []);

  const progressLabel = useMemo(() => `${progress}%`, [progress]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#fff7ed] px-5 py-8 font-sans text-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(249,115,22,0.12),transparent_30%),radial-gradient(circle_at_78%_82%,rgba(251,146,60,0.10),transparent_34%)]" />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-600 via-orange-400 to-amber-400" />

      <main className="relative w-full max-w-[520px] overflow-hidden rounded-[22px] border border-orange-100/80 bg-white shadow-[0_24px_80px_rgba(154,52,18,0.14)]">
        <section className="px-7 pb-6 pt-7 md:px-8 md:pt-8">
          <div className="mb-6">
            <div className="mb-3 text-[0.68rem] font-black uppercase tracking-[0.18em] text-orange-600">
              GHN GTalk Dashboard
            </div>
            <h1 className="text-[1.55rem] font-black leading-tight tracking-[-0.035em] text-slate-950 md:text-[1.85rem]">
              Đang chuẩn bị dữ liệu
            </h1>
            <p className="mt-2 max-w-[420px] text-sm leading-6 text-slate-500">
              Dashboard sẽ tự hiển thị ngay khi dữ liệu mới nhất sẵn sàng.
            </p>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-[#fffaf5] p-4">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Trạng thái
                </div>
                <div className="mt-1 truncate text-sm font-extrabold text-slate-900" aria-live="polite">
                  {LOADING_STEPS[step]}
                </div>
              </div>
              <div className="rounded-full border border-orange-100 bg-white px-3 py-1 text-sm font-black tabular-nums text-orange-600">
                {progressLabel}
              </div>
            </div>

            <div className="relative h-2.5 overflow-hidden rounded-full bg-orange-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 transition-all duration-700 ease-out"
                style={{ width: progressLabel }}
              />
              <div className="absolute inset-y-0 left-0 w-24 animate-[loadingSweep_1.45s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {LOADING_STEPS.map((label, index) => (
                <div
                  key={label}
                  className={`h-1 rounded-full transition-colors duration-500 ${index <= step ? "bg-orange-500" : "bg-orange-100"}`}
                  aria-label={label}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3" aria-hidden="true">
            {[0, 1, 2].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                <div className="h-2 w-14 animate-pulse rounded-full bg-orange-100" />
                <div className="mt-3 h-5 w-16 animate-pulse rounded-md bg-slate-200" />
                <div className="mt-3 h-2 w-12 animate-pulse rounded-full bg-white" />
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-center text-xs font-semibold text-slate-500">
            Có thể mất vài giây khi hệ thống lấy dữ liệu từ Google Sheets.
          </div>
        </section>
      </main>

      <style jsx>{`
        @keyframes loadingSweep {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(560%); }
        }

        @media (max-height: 560px) {
          main { max-width: 500px; }
          section { padding-top: 22px; padding-bottom: 22px; }
          section > div:nth-of-type(3),
          section > div:nth-of-type(4) { display: none; }
        }
      `}</style>
    </div>
  );
}
