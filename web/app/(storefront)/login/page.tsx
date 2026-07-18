import LoginForm from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-3xl bg-surface p-8 shadow-sm sm:p-10">
        <h1 className="mb-6 font-display text-3xl font-bold text-ink">Giriş Yap</h1>
        <LoginForm redirectTo={redirectTo} />
      </div>
    </main>
  );
}
