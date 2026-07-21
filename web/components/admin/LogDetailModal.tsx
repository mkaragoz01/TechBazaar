"use client";

import { useEffect, useRef } from "react";
import type { AuditLogEntry, ErrorLogEntry, LogType } from "@/lib/types";

export default function LogDetailModal({
  type,
  log,
  onClose,
}: {
  type: LogType;
  log: AuditLogEntry | ErrorLogEntry | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (log) {
      ref.current?.showModal();
    } else {
      ref.current?.close();
    }
  }, [log]);

  const errorLog = type === "error" ? (log as ErrorLogEntry | null) : null;
  const auditLog = type === "audit" ? (log as AuditLogEntry | null) : null;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 text-ink backdrop:bg-ink/40"
    >
      {log ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">
              {type === "error" ? "Hata Detayı" : "İşlem Detayı"}
            </h2>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="font-data text-xs uppercase tracking-widest text-ink-muted hover:text-accent"
            >
              Kapat
            </button>
          </div>
          <p className="font-data text-xs text-ink-muted">{new Date(log.createdAt).toLocaleString("tr-TR")}</p>

          {errorLog ? (
            <div className="flex flex-col gap-2 font-data text-xs">
              <p>
                <span className="text-ink-muted">Yol:</span> {errorLog.method} {errorLog.path}
              </p>
              <p>
                <span className="text-ink-muted">Durum Kodu:</span> {errorLog.statusCode}
              </p>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-surface-2 p-3">
                {errorLog.stack || errorLog.message}
              </pre>
            </div>
          ) : null}

          {auditLog ? (
            <div className="flex flex-col gap-4">
              <p className="font-data text-xs">
                <span className="text-ink-muted">Yapan:</span> {auditLog.actor?.name} ({auditLog.actor?.email})
              </p>
              <div className="grid grid-cols-2 gap-4 font-data text-xs">
                <div>
                  <p className="mb-1 font-semibold uppercase tracking-widest text-ink-muted">Önce</p>
                  <pre className="overflow-auto whitespace-pre-wrap rounded-xl bg-surface-2 p-3">
                    {JSON.stringify(auditLog.before, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="mb-1 font-semibold uppercase tracking-widest text-ink-muted">Sonra</p>
                  <pre className="overflow-auto whitespace-pre-wrap rounded-xl bg-surface-2 p-3">
                    {JSON.stringify(auditLog.after, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
