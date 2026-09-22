"use client";

import { useRef } from "react";

export default function ConfirmDeleteButton({
  action,
  confirmMessage,
  label = "Delete",
  className = "text-xs text-muted hover:text-red-600",
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label?: string;
  className?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action}>
      <button
        type="button"
        className={className}
        onClick={() => {
          if (window.confirm(confirmMessage)) formRef.current?.requestSubmit();
        }}
      >
        {label}
      </button>
    </form>
  );
}
