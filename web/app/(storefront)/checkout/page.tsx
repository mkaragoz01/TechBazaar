import { redirect } from "next/navigation";
import { getCart, getAddresses, getPaymentMethods } from "@/lib/api";
import { ApiError } from "@/lib/server-api";
import CheckoutForm from "@/components/checkout/CheckoutForm";

export default async function CheckoutPage() {
  let items;
  let discount;
  try {
    ({ items, discount } = await getCart());
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect("/login?redirectTo=/checkout");
    }
    throw err;
  }

  if (items.length === 0) {
    redirect("/cart");
  }

  const [{ addresses }, { paymentMethods }] = await Promise.all([
    getAddresses(),
    getPaymentMethods(),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-6 font-display text-3xl font-bold text-ink">Siparişi Tamamla</h1>
      <CheckoutForm
        cartItems={items}
        discount={discount}
        initialAddresses={addresses}
        initialPaymentMethods={paymentMethods}
      />
    </main>
  );
}
