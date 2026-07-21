import { getAdminLogs } from "@/lib/api";
import AdminButton from "@/components/admin/AdminButton";
import LogTable from "@/components/admin/LogTable";
import type { LogType } from "@/lib/types";

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; action?: string; from?: string; to?: string; page?: string }>;
}) {
  const { type: typeParam, action, from, to, page } = await searchParams;
  const type: LogType = typeParam === "error" ? "error" : "audit";
  const pageNum = page ? Number(page) : 1;

  const { logs, total, pages } = await getAdminLogs({ type, action, from, to, page: pageNum });

  const exportParams = new URLSearchParams({ type });
  if (action) exportParams.set("action", action);
  if (from) exportParams.set("from", from);
  if (to) exportParams.set("to", to);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">Loglar</h1>
        <a
          href={`/api/admin/logs/export?${exportParams.toString()}`}
          className="font-data text-xs uppercase tracking-widest text-info hover:text-accent"
        >
          Excel&apos;e Aktar
        </a>
      </div>

      <form method="GET" className="mb-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Tür</span>
          <select
            name="type"
            defaultValue={type}
            className="rounded-xl border border-border bg-surface px-4 py-2 font-body text-sm text-ink"
          >
            <option value="audit">İşlem Kayıtları</option>
            <option value="error">Hata Kayıtları</option>
          </select>
        </label>
        {type === "audit" ? (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">İşlem</span>
            <input
              type="text"
              name="action"
              defaultValue={action ?? ""}
              placeholder="örn. user.role.update"
              className="rounded-xl border border-border bg-surface px-4 py-2 font-body text-sm text-ink"
            />
          </label>
        ) : null}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Başlangıç</span>
          <input
            type="date"
            name="from"
            defaultValue={from ?? ""}
            className="rounded-xl border border-border bg-surface px-4 py-2 font-body text-sm text-ink"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Bitiş</span>
          <input
            type="date"
            name="to"
            defaultValue={to ?? ""}
            className="rounded-xl border border-border bg-surface px-4 py-2 font-body text-sm text-ink"
          />
        </label>
        <AdminButton size="sm" type="submit">
          Filtrele
        </AdminButton>
      </form>

      <LogTable type={type} logs={logs} />

      {pages > 1 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => {
            const linkParams = new URLSearchParams({ type });
            if (action) linkParams.set("action", action);
            if (from) linkParams.set("from", from);
            if (to) linkParams.set("to", to);
            linkParams.set("page", String(p));
            return (
              <a
                key={p}
                href={`/admin/logs?${linkParams.toString()}`}
                className={`rounded-full px-3 py-1.5 font-data text-xs ${
                  p === pageNum ? "bg-ink text-bg" : "border border-border text-ink-muted"
                }`}
              >
                {p}
              </a>
            );
          })}
        </div>
      ) : null}

      <p className="mt-2 font-body text-xs text-ink-muted">Toplam {total} kayıt.</p>
    </div>
  );
}
