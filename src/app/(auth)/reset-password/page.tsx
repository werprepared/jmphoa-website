import Link from "next/link";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex-1 flex items-center justify-center bg-primary-light py-12 px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg shadow-sm p-8">
        <h1 className="text-xl font-semibold text-navy mb-6 text-center">Choose a new password</h1>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="text-center space-y-3">
            <p className="text-sm text-red-600">This reset link is missing or invalid.</p>
            <Link href="/forgot-password" className="inline-block text-primary hover:underline text-sm">
              Request a new reset link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
