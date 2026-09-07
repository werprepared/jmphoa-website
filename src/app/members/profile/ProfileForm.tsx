"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileState } from "./actions";
import SpouseField from "./SpouseField";

type Profile = {
  address: string | null;
  phone: string | null;
  publicEmail: string | null;
  children: string | null;
  pets: string | null;
  interests: string | null;
  workInfo: string | null;
  showInDirectory: boolean;
  photoUrl: string | null;
  spouseName: string | null;
  spouseId: string | null;
} | null;

function Field({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue || ""}
        placeholder={placeholder}
        className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(updateProfileAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-muted">
        Everything below is optional. Fields you leave blank simply won&apos;t appear in the Member
        Directory.
      </p>

      {profile?.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.photoUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover border border-border" />
      )}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="photo">
          Profile photo
        </label>
        <input id="photo" name="photo" type="file" accept="image/*" className="text-sm" />
      </div>

      <Field label="Address" name="address" defaultValue={profile?.address} />
      <Field label="Phone" name="phone" defaultValue={profile?.phone} />
      <Field label="Email (shown in directory)" name="publicEmail" defaultValue={profile?.publicEmail} />
      <SpouseField defaultName={profile?.spouseName ?? null} defaultSpouseId={profile?.spouseId ?? null} />
      <Field label="Children" name="children" defaultValue={profile?.children} placeholder="e.g. Emma (8), Jack (5)" />
      <Field label="Pets" name="pets" defaultValue={profile?.pets} placeholder="e.g. Bella (golden retriever)" />
      <Field label="Interests" name="interests" defaultValue={profile?.interests} placeholder="e.g. hiking, book club" />
      <Field label="Work" name="workInfo" defaultValue={profile?.workInfo} placeholder="e.g. Realtor at ABC Realty" />

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="showInDirectory" defaultChecked={profile?.showInDirectory ?? true} />
        Show my profile in the Member Directory
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary">Profile saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-primary hover:bg-primary-dark text-white font-medium px-6 py-2 rounded transition-colors disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
