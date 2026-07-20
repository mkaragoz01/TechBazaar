"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientFetch, ClientApiError } from "@/lib/client-api";
import { formatPriceNumber } from "@/lib/formatPrice";
import Button from "@/components/Button";
import AddressManager from "@/components/AddressManager";
import PaymentMethodManager from "@/components/PaymentMethodManager";
import type { Address, PaymentMethod, CartItem, CartDiscount } from "@/lib/types";

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

  const [selectedAddressId, setSelectedAddressId] = useState(
    initialAddresses.find((a) => a.isDefault)?._id ?? initialAddresses[0]?._id ?? ""
  );
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(
    initialPaymentMethods.find((p) => p.isDefault)?._id ?? initialPaymentMethods[0]?._id ?? ""
  );

  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

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
        <div className="mt-4">
          <AddressManager
            initialAddresses={initialAddresses}
            selectable
            selectedAddressId={selectedAddressId}
            onSelectAddress={setSelectedAddressId}
          />
        </div>
      </section>

      <section className="rounded-2xl bg-surface p-6 shadow-sm">
        <h2 className="font-display text-lg font-bold text-ink">Ödeme Yöntemi</h2>
        <p className="mt-1 font-body text-xs text-ink-muted">
          Bu bir demo mağazadır — gerçek kart bilgisi girmeyin, kart numarasının yalnızca son 4
          hanesi saklanır.
        </p>
        <div className="mt-4">
          <PaymentMethodManager
            initialPaymentMethods={initialPaymentMethods}
            selectable
            selectedPaymentMethodId={selectedPaymentMethodId}
            onSelectPaymentMethod={setSelectedPaymentMethodId}
          />
        </div>
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
        {orderError ? <p className="mt-4 font-body text-sm text-danger">{orderError}</p> : null}
        <Button onClick={handlePlaceOrder} disabled={!canPlaceOrder} className="mt-4 w-full">
          Siparişi Onayla
        </Button>
      </section>
    </div>
  );
}
