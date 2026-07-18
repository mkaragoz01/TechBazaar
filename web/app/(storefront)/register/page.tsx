import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-3xl bg-surface p-8 shadow-sm sm:p-10">
        <h1 className="mb-6 font-display text-3xl font-bold text-ink">Kayıt Ol</h1>
        <RegisterForm />
      </div>
    </main>
  );
}
