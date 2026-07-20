import { redirect } from "next/navigation";
import { getAddresses, getPaymentMethods } from "@/lib/api";
import { ApiError } from "@/lib/server-api";
import AddressManager from "@/components/AddressManager";
import PaymentMethodManager from "@/components/PaymentMethodManager";
import Card from "@/components/Card";

export default async function AccountPage() {
  let addresses;
  let paymentMethods;
  try {
    [{ addresses }, { paymentMethods }] = await Promise.all([getAddresses(), getPaymentMethods()]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect("/login?redirectTo=/account");
    }
    throw err;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 font-display text-3xl font-bold text-ink">Hesabım</h1>

      <div className="flex flex-col gap-8">
        <Card>
          <h2 className="font-display text-lg font-bold text-ink">Adreslerim</h2>
          <div className="mt-4">
            <AddressManager initialAddresses={addresses} />
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-lg font-bold text-ink">Kayıtlı Kartlarım</h2>
          <p className="mt-1 font-body text-xs text-ink-muted">
            Bu bir demo mağazadır — gerçek kart bilgisi girmeyin, kart numarasının yalnızca son 4
            hanesi saklanır.
          </p>
          <div className="mt-4">
            <PaymentMethodManager initialPaymentMethods={paymentMethods} />
          </div>
        </Card>
      </div>
    </main>
  );
}
