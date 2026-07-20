"use client";

import { useState, type FormEvent } from "react";
import { clientFetch, ClientApiError } from "@/lib/client-api";
import FormField from "@/components/FormField";
import type { PaymentMethod } from "@/lib/types";

const CARD_BRANDS = ["Visa", "Mastercard", "Diğer"];
const CURRENT_YEAR = new Date().getFullYear();
const EXPIRY_YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR + i);

function PaymentMethodSummary({ method }: { method: PaymentMethod }) {
  return (
    <div className="font-body text-sm text-ink">
      <p className="font-semibold">
        {method.brand} •••• {method.last4}
      </p>
      <p className="text-ink-muted">
        {method.cardHolderName} · {String(method.expiryMonth).padStart(2, "0")}/{method.expiryYear}
      </p>
    </div>
  );
}

// Reused by both the checkout flow (selectable radio list) and the standalone
// "Hesabım" page (plain manage-only list with delete).
export default function PaymentMethodManager({
  initialPaymentMethods,
  selectable = false,
  selectedPaymentMethodId,
  onSelectPaymentMethod,
}: {
  initialPaymentMethods: PaymentMethod[];
  selectable?: boolean;
  selectedPaymentMethodId?: string;
  onSelectPaymentMethod?: (paymentMethodId: string) => void;
}) {
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods);
  const [showForm, setShowForm] = useState(initialPaymentMethods.length === 0);

  const [cardHolderName, setCardHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardBrand, setCardBrand] = useState(CARD_BRANDS[0]);
  const [expiryMonth, setExpiryMonth] = useState("1");
  const [expiryYear, setExpiryYear] = useState(String(CURRENT_YEAR));
  const [cvv, setCvv] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { paymentMethod } = await clientFetch<{ paymentMethod: PaymentMethod }>(
        "/api/payment-methods",
        {
          method: "POST",
          body: {
            cardHolderName,
            cardNumber,
            brand: cardBrand,
            expiryMonth,
            expiryYear,
            isDefault: paymentMethods.length === 0,
          },
        }
      );
      setPaymentMethods((prev) => [...prev, paymentMethod]);
      onSelectPaymentMethod?.(paymentMethod._id);
      setShowForm(false);
      setCardHolderName("");
      setCardNumber("");
      setCvv("");
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(paymentMethodId: string) {
    setDeletingId(paymentMethodId);
    setError(null);
    try {
      await clientFetch(`/api/payment-methods/${paymentMethodId}`, { method: "DELETE" });
      setPaymentMethods((prev) => prev.filter((p) => p._id !== paymentMethodId));
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Bir hata oluştu.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        {paymentMethods.map((method) =>
          selectable ? (
            <label
              key={method._id}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 has-[:checked]:border-accent"
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method._id}
                checked={selectedPaymentMethodId === method._id}
                onChange={() => onSelectPaymentMethod?.(method._id)}
                className="mt-1"
              />
              <PaymentMethodSummary method={method} />
            </label>
          ) : (
            <div key={method._id} className="flex items-start gap-3 rounded-xl border border-border p-4">
              <div className="flex-1">
                <PaymentMethodSummary method={method} />
              </div>
              <button
                type="button"
                onClick={() => handleDelete(method._id)}
                disabled={deletingId === method._id}
                className="font-data text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-accent disabled:opacity-60"
              >
                Sil
              </button>
            </div>
          )
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-4 border-t border-border pt-4">
          <FormField
            label="Kart Üzerindeki İsim"
            type="text"
            required
            value={cardHolderName}
            onChange={(e) => setCardHolderName(e.target.value)}
          />
          <FormField
            label="Kart Numarası (temsili)"
            type="text"
            inputMode="numeric"
            required
            maxLength={19}
            placeholder="4242 4242 4242 4242"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
          />
          <div className="grid grid-cols-4 gap-4">
            <label className="col-span-1 flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Marka</span>
              <select
                value={cardBrand}
                onChange={(e) => setCardBrand(e.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-3 font-body text-ink"
              >
                {CARD_BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>
            <label className="col-span-1 flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Ay</span>
              <select
                value={expiryMonth}
                onChange={(e) => setExpiryMonth(e.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-3 font-body text-ink"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {String(m).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </label>
            <label className="col-span-1 flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Yıl</span>
              <select
                value={expiryYear}
                onChange={(e) => setExpiryYear(e.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-3 font-body text-ink"
              >
                {EXPIRY_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <FormField
              label="CVV"
              type="text"
              inputMode="numeric"
              maxLength={4}
              className="col-span-1"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
            />
          </div>
          {error ? <p className="font-body text-sm text-danger">{error}</p> : null}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-accent px-5 py-2.5 font-data text-xs uppercase tracking-widest text-accent-ink disabled:opacity-60"
            >
              Kartı Kaydet
            </button>
            {paymentMethods.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 font-data text-xs uppercase tracking-widest text-ink-muted"
              >
                Vazgeç
              </button>
            ) : null}
          </div>
        </form>
      ) : (
        <>
          {error ? <p className="mt-4 font-body text-sm text-danger">{error}</p> : null}
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-4 font-data text-xs uppercase tracking-widest text-info hover:text-accent"
          >
            + Yeni Kart Ekle
          </button>
        </>
      )}
    </div>
  );
}
