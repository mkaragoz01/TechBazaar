import ResetRequestForm from "@/components/ResetRequestForm";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-3xl bg-surface p-8 shadow-sm sm:p-10">
        <h1 className="mb-6 font-display text-3xl font-bold text-ink">Şifre Sıfırlama</h1>
        <ResetRequestForm />
      </div>
    </main>
  );
}
