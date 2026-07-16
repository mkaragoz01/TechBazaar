import ResetRequestForm from "@/components/ResetRequestForm";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-6 font-display text-3xl font-black text-ink">Şifre Sıfırlama</h1>
      <ResetRequestForm />
    </main>
  );
}
