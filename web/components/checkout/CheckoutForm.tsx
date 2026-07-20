"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { clientFetch, ClientApiError } from "@/lib/client-api";
import { formatPriceNumber } from "@/lib/formatPrice";
import FormField from "@/components/FormField";
import type { Address, PaymentMethod, CartItem, CartDiscount } from "@/lib/types";

const CARD_BRANDS = ["Visa", "Mastercard", "Diğer"];
const CURRENT_YEAR = new Date().getFullYear();
const EXPIRY_YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR + i);

export default function CheckoutForm({
  cartItems,
  discount,
  initialAddresses,
  initialPaymentMethods,
}: {
  cartItems: CartItem[];
  discount: CartDiscount | null;
  initialAddresses: Address[];
  initialPaymentMethods: PaymentMethod[];
}) {
  const router = useRouter();

  const [addresses, setAddresses] = useState(initialAddresses);
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods);
  const [selectedAddressId, setSelectedAddressId] = useState(
    initialAddresses.find((a) => a.isDefault)?._id ?? initialAddresses[0]?._id ?? ""
  );
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(
    initialPaymentMethods.find((p) => p.isDefault)?._id ?? initialPaymentMethods[0]?._id ?? ""
  );
  const [showAddressForm, setShowAddressForm] = useState(initialAddresses.length === 0);
  const [showPaymentForm, setShowPaymentForm] = useState(initialPaymentMethods.length === 0);

  const [addrTitle, setAddrTitle] = useState("");
  const [addrFullName, setAddrFullName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrDistrict, setAddrDistrict] = useState("");
  const [addrLine, setAddrLine] = useState("");
  const [addrPostal, setAddrPostal] = useState("");
  const [addrSaving, setAddrSaving] = useState(false);
  const [addrError, setAddrError] = useState<string | null>(null);

  const [cardHolderName, setCardHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardBrand, setCardBrand] = useState(CARD_BRANDS[0]);
  const [expiryMonth, setExpiryMonth] = useState("1");
  const [expiryYear, setExpiryYear] = useState(String(CURRENT_YEAR));
  const [cvv, setCvv] = useState("");
  const [cardSaving, setCardSaving] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  async function handleAddAddress(e: FormEvent) {
    e.preventDefault();
    setAddrSaving(true);
    setAddrError(null);
    try {
      const { address } = await clientFetch<{ address: Address }>("/api/addresses", {
        method: "POST",
        body: {
          title: addrTitle,
          fullName: addrFullName,
          phone: addrPhone,
          city: addrCity,
          district: addrDistrict,
          addressLine: addrLine,
          postalCode: addrPostal,
          isDefault: addresses.length === 0,
        },
      });
      setAddresses((prev) => [...prev, address]);
      setSelectedAddressId(address._id);
      setShowAddressForm(false);
      setAddrTitle("");
      setAddrFullName("");
      setAddrPhone("");
      setAddrCity("");
      setAddrDistrict("");
      setAddrLine("");
      setAddrPostal("");
    } catch (err) {
      setAddrError(err instanceof ClientApiError ? err.message : "Bir hata oluştu.");
    } finally {
      setAddrSaving(false);
    }
  }

  async function handleAddPaymentMethod(e: FormEvent) {
    e.preventDefault();
    setCardSaving(true);
    setCardError(null);
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
      setSelectedPaymentMethodId(paymentMethod._id);
      setShowPaymentForm(false);
      setCardHolderName("");
      setCardNumber("");
      setCvv("");
    } catch (err) {
      setCardError(err instanceof ClientApiError ? err.message : "Bir hata oluştu.");
    } finally {
      setCardSaving(false);
    }
  }

  async function handlePlaceOrder() {
    setPlacingOrder(true);
    setOrderError(null);
    try {
      await clientFetch("/api/orders", {
        method: "POST",
        body: { addressId: selectedAddressId, paymentMethodId: selectedPaymentMethodId },
      });
      router.push("/orders");
      router.refresh();
    } catch (err) {
      setOrderError(err instanceof ClientApiError ? err.message : "Bir hata oluştu.");
      setPlacingOrder(false);
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal - (discount?.amount ?? 0);
  const canPlaceOrder = !!selectedAddressId && !!selectedPaymentMethodId && !placingOrder;

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl bg-surface p-6 shadow-sm">
        <h2 className="font-display text-lg font-bold text-ink">Teslimat Adresi</h2>

        <div className="mt-4 flex flex-col gap-3">
          {addresses.map((address) => (
            <label
              key={address._id}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 has-[:checked]:border-accent"
            >
              <input
                type="radio"
                name="address"
                value={address._id}
                checked={selectedAddressId === address._id}
                onChange={() => setSelectedAddressId(address._id)}
                className="mt-1"
              />
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
            </label>
          ))}
        </div>

        {showAddressForm ? (
          <form onSubmit={handleAddAddress} className="mt-4 flex flex-col gap-4 border-t border-border pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Adres Başlığı"
                type="text"
                required
                placeholder="Ev, İş..."
                value={addrTitle}
                onChange={(e) => setAddrTitle(e.target.value)}
              />
              <FormField
                label="Ad Soyad"
                type="text"
                required
                value={addrFullName}
                onChange={(e) => setAddrFullName(e.target.value)}
              />
            </div>
            <FormField
              label="Telefon"
              type="tel"
              required
              value={addrPhone}
              onChange={(e) => setAddrPhone(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="İl"
                type="text"
                required
                value={addrCity}
                onChange={(e) => setAddrCity(e.target.value)}
              />
              <FormField
                label="İlçe"
                type="text"
                required
                value={addrDistrict}
                onChange={(e) => setAddrDistrict(e.target.value)}
              />
            </div>
            <FormField
              label="Açık Adres"
              type="text"
              required
              value={addrLine}
              onChange={(e) => setAddrLine(e.target.value)}
            />
            <FormField
              label="Posta Kodu (opsiyonel)"
              type="text"
              value={addrPostal}
              onChange={(e) => setAddrPostal(e.target.value)}
            />
            {addrError ? <p className="font-body text-sm text-accent">{addrError}</p> : null}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={addrSaving}
                className="bg-accent px-5 py-2.5 font-data text-xs uppercase tracking-widest text-accent-ink disabled:opacity-60"
              >
                Adresi Kaydet
              </button>
              {addresses.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                  className="px-5 py-2.5 font-data text-xs uppercase tracking-widest text-ink-muted"
                >
                  Vazgeç
                </button>
              ) : null}
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddressForm(true)}
            className="mt-4 font-data text-xs uppercase tracking-widest text-info hover:text-accent"
          >
            + Yeni Adres Ekle
          </button>
        )}
      </section>

      <section className="rounded-2xl bg-surface p-6 shadow-sm">
        <h2 className="font-display text-lg font-bold text-ink">Ödeme Yöntemi</h2>
        <p className="mt-1 font-body text-xs text-ink-muted">
          Bu bir demo mağazadır — gerçek kart bilgisi girmeyin, kart numarasının yalnızca son 4
          hanesi saklanır.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {paymentMethods.map((method) => (
            <label
              key={method._id}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 has-[:checked]:border-accent"
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method._id}
                checked={selectedPaymentMethodId === method._id}
                onChange={() => setSelectedPaymentMethodId(method._id)}
                className="mt-1"
              />
              <div className="font-body text-sm text-ink">
                <p className="font-semibold">
                  {method.brand} •••• {method.last4}
                </p>
                <p className="text-ink-muted">
                  {method.cardHolderName} · {String(method.expiryMonth).padStart(2, "0")}/
                  {method.expiryYear}
                </p>
              </div>
            </label>
          ))}
        </div>

        {showPaymentForm ? (
          <form
            onSubmit={handleAddPaymentMethod}
            className="mt-4 flex flex-col gap-4 border-t border-border pt-4"
          >
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
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Marka
                </span>
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
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Ay
                </span>
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
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Yıl
                </span>
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
            {cardError ? <p className="font-body text-sm text-accent">{cardError}</p> : null}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={cardSaving}
                className="bg-accent px-5 py-2.5 font-data text-xs uppercase tracking-widest text-accent-ink disabled:opacity-60"
              >
                Kartı Kaydet
              </button>
              {paymentMethods.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="px-5 py-2.5 font-data text-xs uppercase tracking-widest text-ink-muted"
                >
                  Vazgeç
                </button>
              ) : null}
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowPaymentForm(true)}
            className="mt-4 font-data text-xs uppercase tracking-widest text-info hover:text-accent"
          >
            + Yeni Kart Ekle
          </button>
        )}
      </section>

      <section className="rounded-2xl bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-border pb-4">
          {discount ? (
            <div className="flex items-center justify-between font-body text-sm text-success">
              <span>{discount.campaignName}</span>
              <span className="font-data tabular-nums">-{formatPriceNumber(discount.amount)} TL</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="font-body text-ink-muted">Toplam</span>
            <span className="font-data text-xl font-semibold tabular-nums text-ink">
              {formatPriceNumber(total)} TL
            </span>
          </div>
        </div>
        {orderError ? <p className="mt-4 font-body text-sm text-accent">{orderError}</p> : null}
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={!canPlaceOrder}
          className="mt-4 w-full rounded-full bg-accent px-7 py-3.5 font-semibold text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          Siparişi Onayla
        </button>
      </section>
    </div>
  );
}
