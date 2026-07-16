import { getResetToken } from "@/lib/api";
import { ApiError } from "@/lib/server-api";
import NewPasswordForm from "@/components/NewPasswordForm";

export default async function NewPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let data;
  try {
    data = await getResetToken(token);
  } catch (err) {
    if (err instanceof ApiError) {
      return (
        <main className="mx-auto max-w-md px-6 py-16">
          <h1 className="mb-4 font-display text-3xl font-black text-ink">
            Şifre Sıfırlama
          </h1>
          <p className="font-body text-accent">{err.message}</p>
        </main>
      );
    }
    throw err;
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-6 font-display text-3xl font-black text-ink">
        Yeni Şifre Belirle
      </h1>
      <NewPasswordForm userId={data.userId} passwordToken={data.passwordToken} />
    </main>
  );
}
