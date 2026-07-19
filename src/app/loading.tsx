"use client";
import React, { useState, useEffect } from 'react';

export default function Loading() {
  const [logs, setLogs] = useState<{ time: string, status: 'run' | 'ok', msg: string }[]>([]);

  useEffect(() => {
    const sequences = [
      { msg: "Đang kết nối đến Google Sheets (Nguồn dữ liệu)...", delay: 200 },
      { msg: "Đang tải dữ liệu nhân sự (Workforce)...", delay: 600 },
      { msg: "Đang tải lịch sử truy cập (Active Users)...", delay: 1100 },
      { msg: "Đồng bộ và làm sạch dữ liệu thành công.", delay: 2000 },
      { msg: "Đang tính toán chỉ số Daily Active User (DAU)...", delay: 2500 },
      { msg: "Khởi tạo mô hình trực quan hóa báo cáo...", delay: 3200 },
      { msg: "Đang hoàn tất giao diện Dashboard...", delay: 3800 }
    ];

    let timeouts: NodeJS.Timeout[] = [];

    const addLog = (msg: string, status: 'run' | 'ok') => {
      setLogs(prev => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { hour12: false });
        return [...prev, { time: timeStr, status, msg }];
      });
    };

    addLog("Hệ thống đã khởi tạo. Bắt đầu luồng xử lý...", "ok");

    sequences.forEach((seq, i) => {
      // Add 'run' log
      timeouts.push(setTimeout(() => {
        setLogs(prev => {
          const newLogs = [...prev];
          // Find the last 'run' and mark 'ok' if it exists
          const lastRunIdx = newLogs.findLastIndex(l => l.status === 'run');
          if (lastRunIdx !== -1) {
            newLogs[lastRunIdx] = { ...newLogs[lastRunIdx], status: 'ok' };
          }
          const now = new Date();
          const timeStr = now.toLocaleTimeString('vi-VN', { hour12: false });
          newLogs.push({ time: timeStr, status: 'run', msg: seq.msg });
          return newLogs;
        });
      }, seq.delay));
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-sm z-50 flex items-center justify-center font-sans">
      <div className="w-[600px] bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden flex flex-col transform scale-105">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <span className="text-xs font-extrabold text-white">G</span>
          </div>
          <div className="font-semibold text-slate-800 tracking-wide text-sm">
            GTalk Data Pipeline
          </div>
        </div>
        
        {/* Logs */}
        <div className="p-5 flex flex-col gap-3.5 min-h-[300px] max-h-[400px] overflow-y-auto custom-scrollbar font-mono text-[0.85rem]">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <span className="text-slate-400 shrink-0 mt-0.5">{log.time}</span>
              {log.status === 'run' ? (
                <div className="shrink-0 w-[55px] flex items-center justify-center border border-blue-200 bg-blue-50 text-blue-600 rounded px-1.5 py-0.5 text-[0.65rem] font-bold tracking-wider shadow-sm">
                  RUN
                </div>
              ) : (
                <div className="shrink-0 w-[55px] flex items-center justify-center border border-emerald-200 bg-emerald-50 text-emerald-600 rounded px-1.5 py-0.5 text-[0.65rem] font-bold tracking-wider shadow-sm">
                  OK
                </div>
              )}
              <span className={`break-words leading-snug mt-0.5 ${log.status === 'run' ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                {log.msg}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
