"use client";

import { useState } from "react";
import type { AuditLogEntry, ErrorLogEntry, LogType } from "@/lib/types";
import LogDetailModal from "./LogDetailModal";

export default function LogTable({
  type,
  logs,
}: {
  type: LogType;
  logs: (AuditLogEntry | ErrorLogEntry)[];
}) {
  const [selected, setSelected] = useState<AuditLogEntry | ErrorLogEntry | null>(null);

  return (
    <>
      <div className="overflow-x-auto border border-border">
        <table className="w-full border-collapse font-body text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left">
              <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">Tarih</th>
              {type === "error" ? (
                <>
                  <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">Yol</th>
                  <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">Durum</th>
                  <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">Mesaj</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">Yapan</th>
                  <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">İşlem</th>
                  <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">Hedef</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const errorLog = type === "error" ? (log as ErrorLogEntry) : null;
              const auditLog = type === "audit" ? (log as AuditLogEntry) : null;
              return (
                <tr
                  key={log._id}
                  onClick={() => setSelected(log)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-2"
                >
                  <td className="px-4 py-3 font-data text-xs text-ink-muted">
                    {new Date(log.createdAt).toLocaleString("tr-TR")}
                  </td>
                  {errorLog ? (
                    <>
                      <td className="px-4 py-3 font-data text-xs text-ink">
                        {errorLog.method} {errorLog.path}
                      </td>
                      <td className="px-4 py-3 font-data text-xs text-danger">{errorLog.statusCode}</td>
                      <td className="max-w-md truncate px-4 py-3 text-ink-muted">{errorLog.message}</td>
                    </>
                  ) : null}
                  {auditLog ? (
                    <>
                      <td className="px-4 py-3 text-ink">
                        {auditLog.actor?.name}
                        <div className="text-xs text-ink-muted">{auditLog.actor?.email}</div>
                      </td>
                      <td className="px-4 py-3 font-data text-xs text-ink">{auditLog.action}</td>
                      <td className="px-4 py-3 font-data text-xs text-ink-muted">
                        {auditLog.targetType}
                        {auditLog.targetId ? ` #${String(auditLog.targetId).slice(-8)}` : ""}
                      </td>
                    </>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
        {logs.length === 0 ? <p className="px-4 py-6 font-body text-ink-muted">Kayıt bulunamadı.</p> : null}
      </div>

      <LogDetailModal type={type} log={selected} onClose={() => setSelected(null)} />
    </>
  );
}
