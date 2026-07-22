"use client";

import Link from "next/link";
import React, { FormEvent, useMemo, useState } from "react";

type Target = "gtalk_download" | "dau_tracking";
type Status = "idle" | "checking" | "ready" | "uploading" | "success" | "error";

type ImportResult = {
  dashboard: string;
  fileName: string;
  importedRows: number;
  importedActiveUsers: number;
  importedDates: string[];
  totalDates: number;
  updatedAt: string | null;
};

const DASHBOARDS: Array<{
  id: Target;
  label: string;
  short: string;
  description: string;
  warning: string;
}> = [
  {
    id: "gtalk_download",
    label: "Gtalk Download",
    short: "Download/Login",
    description: "Cập nhật danh sách ID đã tải và login vào Gtalk theo ngày báo cáo.",
    warning: "Chọn mục này khi file dùng cho dashboard Gtalk Download.",
  },
  {
    id: "dau_tracking",
    label: "DAU",
    short: "Daily Active User",
    description: "Cập nhật danh sách user có sử dụng Gtalk trong ngày được tracking.",
    warning: "Chọn mục này khi file dùng cho dashboard DAU.",
  },
];

function formatUpdatedAt(value: string | null) {
  if (!value) return "Vừa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export default function AdminPage() {
  const [accessCode, setAccessCode] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<Target>("gtalk_download");
  const [date, setDate] = useState("");
  const [confirmedTarget, setConfirmedTarget] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const selectedDashboard = useMemo(
    () => DASHBOARDS.find((dashboard) => dashboard.id === target) ?? DASHBOARDS[0],
    [target]
  );
  const isUnlocked = Boolean(sessionCode);
  const canUpload = Boolean(file && confirmedTarget === selectedDashboard.label && target && sessionCode);

  async function verifyAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("checking");
    setMessage("Đang kiểm tra mã truy cập...");

    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: accessCode }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Không thể xác thực mã truy cập.");

      setSessionCode(accessCode);
      setStatus("ready");
      setMessage("Đã mở khóa trang admin. Bạn có thể upload dữ liệu mới.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Không thể xác thực mã truy cập.");
    }
  }

  async function submitImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canUpload) {
      setStatus("error");
      setMessage(`Vui lòng chọn file và nhập chính xác '${selectedDashboard.label}' để xác nhận dashboard đích.`);
      return;
    }

    const formData = new FormData();
    formData.append("target", target);
    formData.append("confirmedTarget", confirmedTarget);
    formData.append("date", date);
    if (file) formData.append("file", file);

    setStatus("uploading");
    setMessage(`Đang upload vào ${selectedDashboard.label}. Vui lòng giữ nguyên màn hình cho tới khi hoàn tất.`);
    setResult(null);

    try {
      const response = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "x-admin-code": sessionCode },
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Import thất bại.");

      setStatus("success");
      setResult(payload as ImportResult);
      setMessage(`Đã cập nhật thành công dashboard ${payload.dashboard}.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Import thất bại.");
    }
  }

  function handleTargetChange(nextTarget: Target) {
    setTarget(nextTarget);
    setConfirmedTarget("");
    setResult(null);
    setMessage("Đã đổi dashboard đích. Vui lòng xác nhận lại trước khi upload.");
    setStatus(isUnlocked ? "ready" : "idle");
  }

  return (
    <main className="admin-page">
      <section className="admin-shell">
        <div className="admin-hero">
          <div>
            <p className="admin-eyebrow">GHN GTalk Dashboard Admin</p>
            <h1>Upload dữ liệu dashboard</h1>
            <p>
              Trang này dùng để cập nhật dữ liệu active user vào NeonDB. Hãy chọn đúng dashboard đích trước khi upload để tránh ghi nhầm dữ liệu.
            </p>
          </div>
          <Link className="admin-back-link" href="/">Quay lại dashboard</Link>
        </div>

        {!isUnlocked ? (
          <form className="admin-card admin-access-card" onSubmit={verifyAccess}>
            <div>
              <p className="admin-card-label">Bảo vệ trang admin</p>
              <h2>Nhập mã truy cập</h2>
              <p>Chỉ người có mã mới có thể mở form upload dữ liệu.</p>
            </div>
            <label className="admin-field">
              <span>Mã truy cập admin</span>
              <input
                type="password"
                value={accessCode}
                onChange={(event) => setAccessCode(event.target.value)}
                placeholder="Nhập mã truy cập"
                autoComplete="current-password"
                required
              />
            </label>
            <button className="admin-primary-btn" type="submit" disabled={status === "checking"} aria-busy={status === "checking"}>
              {status === "checking" ? "Đang kiểm tra..." : "Mở trang admin"}
            </button>
            {message && <p className={`admin-message ${status === "error" ? "is-error" : ""}`}>{message}</p>}
          </form>
        ) : (
          <form className="admin-grid" onSubmit={submitImport}>
            <section className="admin-card admin-target-card">
              <p className="admin-card-label">Bước 1</p>
              <h2>Chọn dashboard cần cập nhật</h2>
              <p className="admin-help-text">Bắt buộc chọn đúng nơi nhận dữ liệu. Mỗi lựa chọn sẽ ghi vào snapshot khác nhau trong database.</p>

              <div className="admin-dashboard-options" role="radiogroup" aria-label="Dashboard cần cập nhật">
                {DASHBOARDS.map((dashboard) => (
                  <button
                    type="button"
                    key={dashboard.id}
                    className={`admin-dashboard-option ${target === dashboard.id ? "active" : ""}`}
                    onClick={() => handleTargetChange(dashboard.id)}
                    role="radio"
                    aria-checked={target === dashboard.id}
                  >
                    <span>{dashboard.label}</span>
                    <strong>{dashboard.short}</strong>
                    <small>{dashboard.description}</small>
                  </button>
                ))}
              </div>

              <div className="admin-selected-panel">
                <span>Dashboard đang chọn</span>
                <strong>{selectedDashboard.label}</strong>
                <p>{selectedDashboard.warning}</p>
              </div>
            </section>

            <section className="admin-card admin-upload-card">
              <p className="admin-card-label">Bước 2</p>
              <h2>Upload file CSV</h2>
              <p className="admin-help-text">
                Nếu file chỉ có một cột employee_id như mẫu bạn gửi, hãy chọn ngày dữ liệu. Nếu file đã có nhiều cột ngày, hệ thống sẽ tự đọc các ngày trong file.
              </p>

              <label className="admin-field">
                <span>Ngày dữ liệu</span>
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </label>

              <label className="admin-file-field">
                <span>File CSV</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
                <small>{file ? file.name : "Chưa chọn file"}</small>
              </label>

              <label className="admin-field">
                <span>Xác nhận dashboard đích</span>
                <input
                  type="text"
                  value={confirmedTarget}
                  onChange={(event) => setConfirmedTarget(event.target.value)}
                  placeholder={`Gõ chính xác: ${selectedDashboard.label}`}
                />
              </label>

              <button className="admin-primary-btn" type="submit" disabled={!canUpload || status === "uploading"} aria-busy={status === "uploading"}>
                {status === "uploading" ? `Đang cập nhật ${selectedDashboard.label}...` : `Upload vào ${selectedDashboard.label}`}
              </button>
            </section>

            <section className="admin-card admin-result-card" aria-live="polite">
              <p className="admin-card-label">Trạng thái</p>
              <h2>{status === "success" ? "Cập nhật hoàn tất" : status === "uploading" ? "Đang xử lý dữ liệu" : "Sẵn sàng cập nhật"}</h2>
              {message && <p className={`admin-message ${status === "error" ? "is-error" : status === "success" ? "is-success" : ""}`}>{message}</p>}

              {status === "uploading" && (
                <div className="admin-progress" aria-hidden="true">
                  <span />
                </div>
              )}

              {result && (
                <div className="admin-summary">
                  <div><span>Dashboard</span><strong>{result.dashboard}</strong></div>
                  <div><span>File</span><strong>{result.fileName}</strong></div>
                  <div><span>Dòng đã đọc</span><strong>{result.importedRows.toLocaleString("vi-VN")}</strong></div>
                  <div><span>User active import</span><strong>{result.importedActiveUsers.toLocaleString("vi-VN")}</strong></div>
                  <div><span>Ngày import</span><strong>{result.importedDates.join(", ")}</strong></div>
                  <div><span>Tổng ngày trong DB</span><strong>{result.totalDates.toLocaleString("vi-VN")}</strong></div>
                  <div><span>Cập nhật lúc</span><strong>{formatUpdatedAt(result.updatedAt)}</strong></div>
                </div>
              )}
            </section>
          </form>
        )}
      </section>
    </main>
  );
}


