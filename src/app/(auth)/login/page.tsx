import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  return (
    <div className="flex-1 flex items-center justify-center bg-primary-light py-12 px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg shadow-sm p-8">
        <h1 className="text-xl font-semibold text-navy mb-6 text-center">Member Login</h1>
        <LoginForm callbackUrl={callbackUrl || "/members"} />
      </div>
    </div>
  );
}
