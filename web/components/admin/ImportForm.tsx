"use client";

import { useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clientFetch, ClientApiError } from "@/lib/client-api";

type RowAction = "create" | "update" | "error";

type ImportRow = {
  rowNumber: number;
  sku: string;
  name: string;
  action: RowAction;
  errors: string[];
};

type ValidateResponse = {
  summary: { total: number; toCreate: number; toUpdate: number; errors: number };
  rows: ImportRow[];
};

type ConfirmResponse = {
  summary: { created: number; updated: number; failed: number; total: number };
  failedRows: { rowNumber: number; sku: string; errors: string[] }[];
};

const ACTION_LABELS: Record<RowAction, string> = {
  create: "Yeni Oluşturulacak",
  update: "Güncellenecek",
  error: "Hatalı (Atlanacak)",
};

export default function ImportForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [validateResult, setValidateResult] = useState<ValidateResponse | null>(null);
  const [confirmResult, setConfirmResult] = useState<ConfirmResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
    setValidateResult(null);
    setConfirmResult(null);
    setError(null);
  }

  async function handleValidate() {
    if (!file) return;
    setValidating(true);
    setError(null);
    setConfirmResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await clientFetch<ValidateResponse>("/api/admin/products/import/validate", {
        method: "POST",
        body: formData,
      });
      setValidateResult(result);
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Bir hata oluştu.");
    } finally {
      setValidating(false);
    }
  }

  async function handleConfirm() {
    if (!file) return;
    setConfirming(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await clientFetch<ConfirmResponse>("/api/admin/products/import/confirm", {
        method: "POST",
        body: formData,
      });
      setConfirmResult(result);
      router.refresh();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Bir hata oluştu.");
    } finally {
      setConfirming(false);
    }
  }

  const canConfirm =
    !!validateResult &&
    !confirmResult &&
    validateResult.summary.toCreate + validateResult.summary.toUpdate > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-surface p-4 shadow-sm">
        <a
          href="/api/admin/products/import/template"
          className="font-data text-xs uppercase tracking-widest text-info hover:text-accent"
        >
          Şablonu İndir
        </a>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="font-body text-sm text-ink"
        />
        <button
          type="button"
          onClick={handleValidate}
          disabled={!file || validating}
          className="bg-accent px-5 py-2.5 font-data text-xs uppercase tracking-widest text-accent-ink disabled:opacity-60"
        >
          {validating ? "Doğrulanıyor..." : "Doğrula"}
        </button>
      </div>

      {error ? <p className="font-body text-sm text-accent">{error}</p> : null}

      {validateResult && !confirmResult ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4 font-body text-sm text-ink">
            <span>Toplam: {validateResult.summary.total}</span>
            <span className="text-success">Yeni: {validateResult.summary.toCreate}</span>
            <span className="text-info">Güncellenecek: {validateResult.summary.toUpdate}</span>
            <span className="text-accent">Hatalı: {validateResult.summary.errors}</span>
          </div>

          <div className="overflow-x-auto border border-border">
            <table className="w-full border-collapse font-body text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-left">
                  <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                    Satır
                  </th>
                  <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                    SKU
                  </th>
                  <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                    Ürün
                  </th>
                  <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                    Durum
                  </th>
                  <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                    Hata
                  </th>
                </tr>
              </thead>
              <tbody>
                {validateResult.rows.map((row) => (
                  <tr key={row.rowNumber} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-data text-xs text-ink-muted">{row.rowNumber}</td>
                    <td className="px-4 py-3 text-ink">{row.sku || "-"}</td>
                    <td className="px-4 py-3 text-ink">{row.name || "-"}</td>
                    <td className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                      {ACTION_LABELS[row.action]}
                    </td>
                    <td className="px-4 py-3 text-xs text-accent">{row.errors.join(" ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || confirming}
            className="w-fit bg-accent px-6 py-3 font-data text-xs uppercase tracking-widest text-accent-ink disabled:opacity-60"
          >
            {confirming ? "İçe Aktarılıyor..." : "Onayla ve İçe Aktar"}
          </button>
        </div>
      ) : null}

      {confirmResult ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4 font-body text-sm text-ink">
            <span className="text-success">Oluşturuldu: {confirmResult.summary.created}</span>
            <span className="text-info">Güncellendi: {confirmResult.summary.updated}</span>
            <span className="text-accent">Başarısız: {confirmResult.summary.failed}</span>
          </div>
          {confirmResult.failedRows.length > 0 ? (
            <div className="overflow-x-auto border border-border">
              <table className="w-full border-collapse font-body text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface text-left">
                    <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                      Satır
                    </th>
                    <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                      SKU
                    </th>
                    <th className="px-4 py-3 font-data text-xs uppercase tracking-widest text-ink-muted">
                      Hata
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {confirmResult.failedRows.map((row) => (
                    <tr key={row.rowNumber} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-data text-xs text-ink-muted">{row.rowNumber}</td>
                      <td className="px-4 py-3 text-ink">{row.sku || "-"}</td>
                      <td className="px-4 py-3 text-xs text-accent">{row.errors.join(" ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <Link
            href="/admin/products"
            className="w-fit font-data text-xs uppercase tracking-widest text-info hover:text-accent"
          >
            Ürünlere Dön
          </Link>
        </div>
      ) : null}
    </div>
  );
}
