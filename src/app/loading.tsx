"use client";
import React, { useEffect, useState } from "react";

const LOADING_STEPS = [
  "Kết nối dữ liệu Gtalk",
  "Tải dữ liệu nhân sự",
  "Đồng bộ hoạt động người dùng",
  "Tính toán chỉ số dashboard",
  "Hoàn tất giao diện báo cáo",
];

const STEP_PROGRESS = [18, 38, 62, 82, 96];
const STEP_DELAYS = [180, 720, 1320, 2100, 2920];
const PREVIEW_BARS = [64, 88, 52, 74, 46];

export default function Loading() {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(10);
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const timers = STEP_DELAYS.map((delay, index) => setTimeout(() => {
      setStep(index);
      setProgress(STEP_PROGRESS[index]);
    }, delay));

    const dots = setInterval(() => {
      setDotCount((count) => count === 3 ? 1 : count + 1);
    }, 460);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(dots);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#fff3e7] px-5 py-6 font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,107,0,0.18),transparent_28%),radial-gradient(circle_at_82%_76%,rgba(251,146,60,0.14),transparent_32%)]" />
      <div className="absolute -top-24 left-1/2 h-64 w-[720px] -translate-x-1/2 rounded-full bg-orange-300/25 blur-3xl" />

      <main className="relative w-full max-w-[720px] rounded-[26px] border border-orange-100/90 bg-white/95 p-6 shadow-[0_24px_80px_rgba(154,52,18,0.16)] backdrop-blur md:p-8">
        <div className="mb-7 flex items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="mb-3 inline-flex rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-orange-600">
              GHN Gtalk Dashboard
            </div>
            <h1 className="text-2xl font-extrabold tracking-[-0.03em] text-slate-950 md:text-3xl">
              Đang chuẩn bị dashboard
            </h1>
            <p className="mt-2 max-w-[520px] text-sm leading-6 text-slate-600">
              Dữ liệu đang được tải và xử lý. Các trạng thái bên dưới sẽ thay đổi liên tục để bạn biết hệ thống vẫn đang hoạt động.
            </p>
          </div>

          <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-xl font-black text-white shadow-lg shadow-orange-500/25 sm:flex">
            G
          </div>
        </div>

        <section className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-orange-500">Đang xử lý</div>
              <div className="mt-1 truncate text-base font-bold text-slate-950">
                {LOADING_STEPS[step]}{".".repeat(dotCount)}
              </div>
            </div>
            <div className="rounded-full bg-white px-3 py-1.5 text-sm font-black text-orange-600 shadow-sm">
              {progress}%
            </div>
          </div>

          <div className="relative h-3 overflow-hidden rounded-full bg-orange-100">
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 animate-pulse bg-white/25" />
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-5">
            {LOADING_STEPS.map((label, index) => (
              <div
                key={label}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  index <= step ? "bg-orange-500" : "bg-orange-100"
                }`}
                aria-label={label}
              />
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-[1fr_1.15fr]">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200" />
              <div className="h-7 w-20 animate-pulse rounded-lg bg-orange-50" />
            </div>
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="rounded-xl bg-slate-50 p-3">
                  <div className="h-2.5 w-24 animate-pulse rounded-full bg-orange-100" />
                  <div className="mt-3 h-5 w-20 animate-pulse rounded-md bg-slate-200" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="mb-4 h-3 w-36 animate-pulse rounded-full bg-slate-200" />
            <div className="flex h-36 items-end gap-3">
              {PREVIEW_BARS.map((height, index) => (
                <div key={index} className="flex flex-1 items-end rounded-t-lg bg-orange-50">
                  <div
                    className="w-full animate-pulse rounded-t-lg bg-gradient-to-t from-orange-300 to-amber-200"
                    style={{ height: `${height}%`, animationDelay: `${index * 100}ms` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50/80 px-4 py-3 text-center text-xs font-semibold text-orange-700">
          Vui lòng giữ nguyên màn hình, dashboard sẽ tự hiển thị sau khi dữ liệu sẵn sàng.
        </div>
      </main>
    </div>
  );
}
