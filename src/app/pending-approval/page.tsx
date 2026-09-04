export default function PendingApprovalPage() {
  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold text-navy mb-3">Your account is pending approval</h1>
        <p className="text-muted">
          Thanks for registering with the John Mitchell Preserve HOA website. A Membership Coordinator
          still needs to approve your account before you can access member-only pages. You&apos;ll be able
          to log in as soon as that happens.
        </p>
      </div>
    </div>
  );
}
