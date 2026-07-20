import LoginForm from "@/components/LoginForm";
import Card from "@/components/Card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <Card size="lg">
        <h1 className="mb-6 font-display text-3xl font-bold text-ink">Giriş Yap</h1>
        <LoginForm redirectTo={redirectTo} />
      </Card>
    </main>
  );
}
