import { auth } from "@/auth";
import SiteNav from "./SiteNav";

export default async function Header() {
  const session = await auth();
  const user = session?.user ? { name: session.user.name ?? "Member", role: session.user.role } : null;
  return <SiteNav user={user} />;
}
