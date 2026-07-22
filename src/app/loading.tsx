"use client";
import React, { useEffect, useMemo, useState } from "react";

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
    const timers = STEP_DELAYS.map((delay, index) => setTimeout(() => {
      setStep(index);
      setProgress(STEP_PROGRESS[index]);
    }, delay));

    return () => timers.forEach(clearTimeout);
  }, []);

  const progressLabel = useMemo(() => `${progress}%`, [progress]);
  const progressRing = `conic-gradient(#f97316 ${progress * 3.6}deg, #ffedd5 0deg)`;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-[#fff7ed] px-6 py-8 font-sans text-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(249,115,22,0.14),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(251,146,60,0.10),transparent_36%)]" />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-600 via-orange-400 to-amber-300" />

      <main className="relative w-full max-w-[460px] rounded-[30px] border border-orange-100/90 bg-white/95 px-7 py-8 text-center shadow-[0_26px_90px_rgba(154,52,18,0.15)] backdrop-blur md:px-9 md:py-10">
        <div className="mx-auto mb-7 w-fit rounded-full border border-orange-100 bg-orange-50 px-3.5 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.18em] text-orange-600">
          GHN GTalk Dashboard
        </div>

        <div className="relative mx-auto mb-7 grid h-32 w-32 place-items-center rounded-full" style={{ background: progressRing }}>
          <div className="absolute inset-2 rounded-full bg-white shadow-inner" />
          <div className="relative grid h-24 w-24 place-items-center rounded-full bg-[#fffaf5] ring-1 ring-orange-100">
            <span className="text-[1.7rem] font-black tracking-[-0.05em] text-orange-600 tabular-nums">
              {progressLabel}
            </span>
          </div>
          <div className="absolute inset-0 animate-[softSpin_2.4s_linear_infinite] rounded-full border border-transparent border-t-orange-300" />
        </div>

        <h1 className="text-[1.7rem] font-black leading-tight tracking-[-0.04em] text-slate-950 md:text-[2rem]">
          Đang chuẩn bị dashboard
        </h1>
        <p className="mx-auto mt-3 max-w-[350px] text-sm leading-6 text-slate-500">
          Hệ thống đang tải dữ liệu mới nhất. Dashboard sẽ tự hiển thị khi sẵn sàng.
        </p>

        <div className="mx-auto mt-6 max-w-[340px] rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
          <div className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-400">
            Trạng thái hiện tại
          </div>
          <div className="mt-1 text-sm font-extrabold text-slate-900" aria-live="polite">
            {LOADING_STEPS[step]}
          </div>
        </div>

        <div className="mx-auto mt-5 flex w-fit items-center gap-2" aria-hidden="true">
          {LOADING_STEPS.map((label, index) => (
            <div
              key={label}
              className={`h-2 rounded-full transition-all duration-500 ${
                index === step
                  ? "w-8 bg-orange-500"
                  : index < step
                    ? "w-2 bg-orange-300"
                    : "w-2 bg-orange-100"
              }`}
            />
          ))}
        </div>

        <p className="mt-6 text-xs font-medium text-slate-400">
          Có thể mất vài giây khi đồng bộ từ Google Sheets.
        </p>
      </main>

      <style jsx>{`
        @keyframes softSpin {
          to { transform: rotate(360deg); }
        }

        @media (max-height: 560px) {
          main { padding-top: 24px; padding-bottom: 24px; max-width: 430px; }
          main > div:nth-of-type(2) { width: 104px; height: 104px; margin-bottom: 18px; }
          main > div:nth-of-type(2) > div:nth-of-type(2) { width: 78px; height: 78px; }
          h1 { font-size: 1.45rem; }
          p:last-child { display: none; }
        }
      `}</style>
    </div>
  );
}
