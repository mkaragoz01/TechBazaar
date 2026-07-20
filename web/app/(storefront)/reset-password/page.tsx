import ResetRequestForm from "@/components/ResetRequestForm";
import Card from "@/components/Card";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <Card size="lg">
        <h1 className="mb-6 font-display text-3xl font-bold text-ink">Şifre Sıfırlama</h1>
        <ResetRequestForm />
      </Card>
    </main>
  );
}
