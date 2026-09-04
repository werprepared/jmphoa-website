import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-primary-light py-12 px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-sm p-8">
        <h1 className="text-xl font-semibold text-navy mb-2 text-center">Join JMPHOA Online</h1>
        <p className="text-sm text-muted text-center mb-6">
          Registration requests are reviewed by our Membership Coordinator before access is granted.
        </p>
        <RegisterForm />
      </div>
    </div>
  );
}
