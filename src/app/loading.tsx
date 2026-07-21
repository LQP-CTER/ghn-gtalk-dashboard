"use client";
import React, { useEffect, useState } from "react";

const LOADING_STEPS = [
  "Kết nối nguồn dữ liệu Gtalk",
  "Tải dữ liệu nhân sự và hoạt động",
  "Đồng bộ dữ liệu từ Google Sheets",
  "Tính toán các chỉ số dashboard",
  "Hoàn tất giao diện báo cáo",
];

const STEP_PROGRESS = [22, 42, 64, 82, 94];
const STEP_DELAYS = [220, 760, 1360, 2140, 3000];
const KPI_SKELETONS = ["Tổng nhân sự", "Đã tải", "Đã đăng nhập"];
const CHART_BARS = [46, 72, 58, 88, 64, 78, 52, 94];
const TABLE_ROWS = [0, 1, 2, 3];

export default function Loading() {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(14);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const timeouts = STEP_DELAYS.map((delay, index) => setTimeout(() => {
      setStep(index);
      setProgress(STEP_PROGRESS[index]);
    }, delay));

    const ticker = setInterval(() => {
      setPulse((current) => (current + 1) % 3);
    }, 520);

    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(ticker);
    };
  }, []);

  const activeMessage = LOADING_STEPS[step];
  const loadingDots = ".".repeat(pulse + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#fff4e8] px-6 font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,107,0,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(251,146,60,0.16),transparent_36%)]" />
      <div className="absolute left-1/2 top-10 h-28 w-[520px] -translate-x-1/2 rounded-full bg-orange-300/20 blur-3xl" />

      <div className="relative w-full max-w-[860px] overflow-hidden rounded-[20px] border border-orange-100 bg-white shadow-[0_24px_80px_rgba(154,52,18,0.16)]">
        <div className="relative h-1.5 overflow-hidden bg-orange-100">
          <div className="absolute inset-y-0 left-0 w-2/3 animate-pulse rounded-r-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />
        </div>

        <div className="grid gap-0 md:grid-cols-[0.9fr_1.1fr]">
          <section className="border-b border-orange-100 bg-gradient-to-br from-orange-50 to-white p-6 md:border-b-0 md:border-r">
            <div className="mb-8">
              <div className="mb-2 text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-orange-600">
                GHN Gtalk Dashboard
              </div>
              <h1 className="text-xl font-bold tracking-[-0.02em] text-slate-950">
                Đang chuẩn bị dữ liệu báo cáo
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Hệ thống đang tải, đồng bộ và dựng dashboard. Các chuyển động bên dưới cho biết tiến trình vẫn đang chạy bình thường.
              </p>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-slate-900">
                  {activeMessage}{loadingDots}
                </span>
                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-sm font-extrabold text-orange-600">
                  {progress}%
                </span>
              </div>

              <div className="relative h-2.5 overflow-hidden rounded-full bg-orange-100">
                <div
                  className="relative h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-y-0 right-0 w-16 animate-pulse bg-white/35 blur-sm" />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {LOADING_STEPS.map((message, index) => (
                  <div
                    key={message}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-300 ${
                      index <= step
                        ? "border-orange-100 bg-orange-50 text-orange-700 shadow-sm"
                        : "border-slate-100 bg-slate-50 text-slate-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        index === step ? "animate-ping bg-orange-500" : index < step ? "bg-orange-400" : "bg-slate-300"
                      }`}
                    />
                    <span>{message}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="h-3 w-32 animate-pulse rounded-full bg-orange-100" />
                <div className="mt-3 h-7 w-56 animate-pulse rounded-lg bg-slate-100" />
              </div>
              <div className="h-9 w-28 animate-pulse rounded-lg bg-orange-50" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {KPI_SKELETONS.map((label) => (
                <div key={label} className="rounded-2xl border border-orange-50 bg-orange-50/60 p-4">
                  <div className="h-2.5 w-16 animate-pulse rounded-full bg-orange-200/70" />
                  <div className="mt-4 h-7 w-20 animate-pulse rounded-lg bg-orange-100" />
                  <div className="mt-3 h-2.5 w-24 animate-pulse rounded-full bg-white" />
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-orange-50 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200" />
                <div className="h-8 w-24 animate-pulse rounded-lg bg-orange-50" />
              </div>
              <div className="flex h-40 items-end gap-3">
                {CHART_BARS.map((height, index) => (
                  <div key={index} className="flex flex-1 items-end overflow-hidden rounded-t-md bg-orange-50">
                    <div
                      className="w-full animate-pulse rounded-t-md bg-gradient-to-t from-orange-300 to-amber-200 transition-all duration-700"
                      style={{ height: `${height}%`, animationDelay: `${index * 90}ms` }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-orange-50 bg-white p-4 shadow-sm">
              {TABLE_ROWS.map((item) => (
                <div key={item} className="flex items-center gap-3 border-b border-orange-50 py-2.5 last:border-b-0">
                  <div className="h-8 w-8 animate-pulse rounded-lg bg-orange-50" />
                  <div className="flex-1">
                    <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-200" />
                    <div className="mt-2 h-2.5 w-1/3 animate-pulse rounded-full bg-orange-50" />
                  </div>
                  <div className="h-6 w-14 animate-pulse rounded-md bg-orange-50" />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="border-t border-orange-100 bg-orange-50/60 px-6 py-3 text-center text-xs font-semibold text-orange-700">
          Dashboard vẫn đang xử lý dữ liệu, vui lòng giữ nguyên màn hình trong giây lát.
        </div>
      </div>
    </div>
  );
}
