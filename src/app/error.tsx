"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-navy mb-2">Something went wrong</h1>
        <p className="text-muted mb-4">{error.message || "Please try again."}</p>
        <button
          onClick={() => reset()}
          className="bg-primary hover:bg-primary-dark text-white font-medium px-5 py-2 rounded transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
