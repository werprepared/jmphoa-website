"use client";

import { useActionState, useState } from "react";
import { createArcRequestAction, type CreateArcRequestState } from "../actions";
import { ARC_REQUEST_TYPE_LABELS, ARC_MIN_START_DAYS } from "@/lib/arc";
import type { ArcRequestType } from "@prisma/client";

const REQUEST_TYPES = Object.keys(ARC_REQUEST_TYPE_LABELS) as ArcRequestType[];

function TextField({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

function FileField({ label, name, help }: { label: string; name: string; help?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" htmlFor={name}>
        {label}
      </label>
      <input id={name} name={name} type="file" className="text-sm" />
      {help && <p className="text-xs text-muted mt-1">{help}</p>}
    </div>
  );
}

export default function NewArcRequestForm({
  defaultName,
  defaultAddress,
  defaultPhone,
  defaultEmail,
}: {
  defaultName: string;
  defaultAddress: string;
  defaultPhone: string;
  defaultEmail: string;
}) {
  const [state, formAction, pending] = useActionState<CreateArcRequestState, FormData>(createArcRequestAction, undefined);
  const [requestType, setRequestType] = useState<ArcRequestType | "">("");

  return (
    <form action={formAction} className="space-y-8">
      <section className="space-y-4">
        <h2 className="font-semibold text-navy">I. Request Submitter Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Name" name="requesterName" defaultValue={defaultName} required />
          <TextField label="Address/Unit #" name="requesterAddress" defaultValue={defaultAddress} required />
          <TextField label="Phone" name="requesterPhone" defaultValue={defaultPhone} />
          <TextField label="Email" name="requesterEmail" defaultValue={defaultEmail} type="email" required />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-navy">II. Requested Change</h2>
        <p className="text-xs text-muted">Each requested change requires a separate application.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {REQUEST_TYPES.map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="requestType"
                value={t}
                checked={requestType === t}
                onChange={() => setRequestType(t)}
                required
              />
              {ARC_REQUEST_TYPE_LABELS[t]}
            </label>
          ))}
        </div>
        {requestType === "OTHER" && (
          <TextField label="Please specify" name="requestTypeOther" required placeholder="Describe the requested change" />
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-navy">III. Specific Description of Improvement, Modification or Change</h2>
        <TextField label="Location on property - specify" name="locationOnProperty" />
        <TextField label="Size/dimensions of modification" name="sizeDimensions" />
        <TextField label="Color" name="color" />
        <div>
          <TextField label="Materials" name="materials" />
          <p className="text-xs text-muted mt-1">Note: ALL wood used MUST be pressure treated.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Estimated starting date" name="startDate" type="date" />
          <TextField label="Estimated completion date" name="completionDate" type="date" />
        </div>
        <p className="text-xs text-muted -mt-2">
          Starting date must be at least {ARC_MIN_START_DAYS} days after submitting this application.
        </p>
        <TextField label="Contractor Name, Address & Phone" name="contractorName" />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-navy">IV. Attachments</h2>
        <p className="text-xs text-muted">
          You can add these now, or upload them later from the request&apos;s page once submitted.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FileField label="Property survey" name="survey" help="Recorded survey showing the proposed change." />
          <FileField label="Photos" name="photos" help="Photos or samples of the structure requested." />
          <FileField label="Plans/drawings" name="plans" help="Front, top, and side views." />
          <FileField label="Landscaping details" name="landscaping" help="Types/quantities of plants, additions, removals." />
        </div>
      </section>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-primary hover:bg-primary-dark text-white font-medium px-6 py-2 rounded transition-colors disabled:opacity-60"
      >
        {pending ? "Submitting..." : "Submit ARC Request"}
      </button>
    </form>
  );
}
