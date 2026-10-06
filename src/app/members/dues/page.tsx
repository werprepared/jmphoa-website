import { redirect } from "next/navigation";

// Dues moved to the public /dues page so invoice QR codes work without a login.
export default function MembersDuesRedirect() {
  redirect("/dues");
}
