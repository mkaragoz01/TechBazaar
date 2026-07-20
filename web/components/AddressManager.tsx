"use client";

import { useState, type FormEvent } from "react";
import { clientFetch, ClientApiError } from "@/lib/client-api";
import FormField from "@/components/FormField";
import type { Address } from "@/lib/types";

function AddressSummary({ address }: { address: Address }) {
  return (
    <div className="font-body text-sm text-ink">
      <p className="font-semibold">
        {address.title} — {address.fullName}
      </p>
      <p className="text-ink-muted">{address.phone}</p>
      <p className="text-ink-muted">
        {address.addressLine}, {address.district}/{address.city}
        {address.postalCode ? ` ${address.postalCode}` : ""}
      </p>
    </div>
  );
}

// Reused by both the checkout flow (selectable radio list) and the standalone
// "Hesabım" page (plain manage-only list with delete) — one fetch/add/delete
// implementation instead of two copies.
export default function AddressManager({
  initialAddresses,
  selectable = false,
  selectedAddressId,
  onSelectAddress,
}: {
  initialAddresses: Address[];
  selectable?: boolean;
  selectedAddressId?: string;
  onSelectAddress?: (addressId: string) => void;
}) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [showForm, setShowForm] = useState(initialAddresses.length === 0);

  const [title, setTitle] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { address } = await clientFetch<{ address: Address }>("/api/addresses", {
        method: "POST",
        body: {
          title,
          fullName,
          phone,
          city,
          district,
          addressLine,
          postalCode,
          isDefault: addresses.length === 0,
        },
      });
      setAddresses((prev) => [...prev, address]);
      onSelectAddress?.(address._id);
      setShowForm(false);
      setTitle("");
      setFullName("");
      setPhone("");
      setCity("");
      setDistrict("");
      setAddressLine("");
      setPostalCode("");
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(addressId: string) {
    setDeletingId(addressId);
    setError(null);
    try {
      await clientFetch(`/api/addresses/${addressId}`, { method: "DELETE" });
      setAddresses((prev) => prev.filter((a) => a._id !== addressId));
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Bir hata oluştu.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        {addresses.map((address) =>
          selectable ? (
            <label
              key={address._id}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 has-[:checked]:border-accent"
            >
              <input
                type="radio"
                name="address"
                value={address._id}
                checked={selectedAddressId === address._id}
                onChange={() => onSelectAddress?.(address._id)}
                className="mt-1"
              />
              <AddressSummary address={address} />
            </label>
          ) : (
            <div key={address._id} className="flex items-start gap-3 rounded-xl border border-border p-4">
              <div className="flex-1">
                <AddressSummary address={address} />
              </div>
              <button
                type="button"
                onClick={() => handleDelete(address._id)}
                disabled={deletingId === address._id}
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
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Adres Başlığı"
              type="text"
              required
              placeholder="Ev, İş..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <FormField
              label="Ad Soyad"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <FormField
            label="Telefon"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="İl" type="text" required value={city} onChange={(e) => setCity(e.target.value)} />
            <FormField
              label="İlçe"
              type="text"
              required
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />
          </div>
          <FormField
            label="Açık Adres"
            type="text"
            required
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
          />
          <FormField
            label="Posta Kodu (opsiyonel)"
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
          />
          {error ? <p className="font-body text-sm text-danger">{error}</p> : null}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-accent px-5 py-2.5 font-data text-xs uppercase tracking-widest text-accent-ink disabled:opacity-60"
            >
              Adresi Kaydet
            </button>
            {addresses.length > 0 ? (
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
            + Yeni Adres Ekle
          </button>
        </>
      )}
    </div>
  );
}
