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
const PREVIEW_BARS = [54, 76, 44, 88, 62, 70];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#fff4e8] px-6 py-8 font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,107,0,0.16),transparent_30%),radial-gradient(circle_at_84%_78%,rgba(251,146,60,0.13),transparent_34%)]" />
      <div className="absolute left-1/2 top-[-120px] h-72 w-[680px] -translate-x-1/2 rounded-full bg-orange-300/25 blur-3xl" />

      <main className="relative w-full max-w-[560px] overflow-hidden rounded-[24px] border border-orange-100 bg-white shadow-[0_22px_70px_rgba(154,52,18,0.16)]">
        <div className="h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />

        <div className="p-6 md:p-7">
          <div className="mb-6 flex items-start justify-between gap-5">
            <div className="min-w-0">
              <div className="mb-3 inline-flex rounded-full bg-orange-50 px-3 py-1 text-[0.67rem] font-black uppercase tracking-[0.16em] text-orange-600 ring-1 ring-orange-100">
                GHN Gtalk Dashboard
              </div>
              <h1 className="text-[1.7rem] font-black leading-tight tracking-[-0.04em] text-slate-950 md:text-[2rem]">
                Đang chuẩn bị dashboard
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Dữ liệu đang được tải và xử lý. Dashboard sẽ tự hiển thị khi hoàn tất.
              </p>
            </div>

            <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-base font-black text-white shadow-lg shadow-orange-500/25 sm:flex">
              G
            </div>
          </div>

          <section className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-orange-600">
                  Đang xử lý
                </div>
                <div className="mt-1 truncate text-base font-extrabold text-slate-950">
                  {LOADING_STEPS[step]}{".".repeat(dotCount)}
                </div>
              </div>
              <div className="text-2xl font-black tracking-[-0.04em] text-orange-600">
                {progress}%
              </div>
            </div>

            <div className="relative h-3 overflow-hidden rounded-full bg-orange-100 shadow-inner">
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-y-0 right-0 w-20 animate-pulse bg-white/35 blur-sm" />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2">
              {LOADING_STEPS.map((label, index) => (
                <div
                  key={label}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    index <= step ? "bg-orange-500" : "bg-white"
                  }`}
                  aria-label={label}
                />
              ))}
            </div>
          </section>

          <section className="mt-5 hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm min-[720px]:block">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="h-3 w-32 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-2 h-2.5 w-48 animate-pulse rounded-full bg-orange-50" />
              </div>
              <div className="h-8 w-24 animate-pulse rounded-lg bg-orange-50" />
            </div>

            <div className="grid grid-cols-[0.8fr_1.2fr] gap-4">
              <div className="space-y-2.5">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="rounded-xl bg-slate-50 p-3">
                    <div className="h-2.5 w-20 animate-pulse rounded-full bg-orange-100" />
                    <div className="mt-2 h-4 w-16 animate-pulse rounded-md bg-slate-200" />
                  </div>
                ))}
              </div>

              <div className="flex h-28 items-end gap-2 rounded-xl bg-slate-50 p-3">
                {PREVIEW_BARS.map((height, index) => (
                  <div key={index} className="flex flex-1 items-end rounded-t-md bg-white">
                    <div
                      className="w-full animate-pulse rounded-t-md bg-gradient-to-t from-orange-300 to-amber-200"
                      style={{ height: `${height}%`, animationDelay: `${index * 90}ms` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="mt-5 rounded-2xl border border-orange-100 bg-white px-4 py-3 text-center text-xs font-bold text-orange-700 shadow-sm">
            Vui lòng giữ nguyên màn hình trong giây lát.
          </div>
        </div>
      </main>
    </div>
  );
}
