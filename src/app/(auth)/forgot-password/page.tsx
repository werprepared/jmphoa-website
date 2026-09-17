import ForgotPasswordForm from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-primary-light py-12 px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg shadow-sm p-8">
        <h1 className="text-xl font-semibold text-navy mb-2 text-center">Reset your password</h1>
        <p className="text-sm text-muted text-center mb-6">
          Enter your account email and we&apos;ll send you a link to choose a new password.
        </p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
