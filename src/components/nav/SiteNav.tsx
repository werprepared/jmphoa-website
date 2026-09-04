"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ROLE_LABELS } from "@/lib/roles";
import type { Role } from "@prisma/client";
import { logoutAction } from "@/app/(auth)/actions";

type NavUser = { name: string; role: Role } | null;

const ABOUT_LINKS = [
  { href: "/about", label: "Overview" },
  { href: "/about/board", label: "Board Members" },
  { href: "/about/committees", label: "Committee Members" },
  { href: "/about/faq", label: "FAQ" },
  { href: "/about/sponsors", label: "Sponsors" },
];

const MEMBER_LINKS = [
  { href: "/members", label: "Members Home" },
  { href: "/members/directory", label: "Member Directory" },
  { href: "/members/community", label: "Community Wall" },
  { href: "/members/committees", label: "Join a Committee" },
  { href: "/members/documents", label: "HOA Documents" },
  { href: "/members/survey", label: "Survey / Feedback" },
  { href: "/members/dues", label: "Pay Association Fees" },
];

function Dropdown({
  label,
  href,
  links,
  active,
}: {
  label: string;
  href: string;
  links: { href: string; label: string }[];
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={href}
        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium hover:bg-primary-dark rounded transition-colors ${
          active ? "bg-primary-dark" : ""
        }`}
        onClick={() => setOpen(false)}
      >
        {label}
        <svg width="10" height="10" viewBox="0 0 10 10" className="mt-0.5" aria-hidden>
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.4" fill="none" />
        </svg>
      </Link>
      {open && (
        <div className="absolute left-0 top-full min-w-48 bg-white text-navy shadow-lg rounded-b overflow-hidden border border-border z-50">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block px-4 py-2 text-sm hover:bg-primary-light"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SiteNav({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdminish =
    user &&
    ["ADMIN", "MEMBERSHIP_COORDINATOR", "BOARD_MEMBER", "COMMITTEE_ARCH", "COMMITTEE_SOCIAL"].includes(
      user.role
    );

  return (
    <header className="bg-primary text-white sticky top-0 z-40 shadow">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-semibold text-lg tracking-tight">
            John Mitchell Preserve <span className="hidden sm:inline">HOA</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-2 text-sm font-medium hover:bg-primary-dark rounded ${
                pathname === "/" ? "bg-primary-dark" : ""
              }`}
            >
              Home
            </Link>
            <Link
              href="/calendar"
              className={`px-3 py-2 text-sm font-medium hover:bg-primary-dark rounded ${
                pathname.startsWith("/calendar") ? "bg-primary-dark" : ""
              }`}
            >
              Calendar
            </Link>
            <Dropdown label="About" href="/about" links={ABOUT_LINKS} active={pathname.startsWith("/about")} />
            {user && (
              <Dropdown
                label="Members"
                href="/members"
                links={MEMBER_LINKS}
                active={pathname.startsWith("/members")}
              />
            )}
            <Link
              href="/contact"
              className={`px-3 py-2 text-sm font-medium hover:bg-primary-dark rounded ${
                pathname.startsWith("/contact") ? "bg-primary-dark" : ""
              }`}
            >
              Contact Us
            </Link>
            {isAdminish && (
              <Link
                href="/admin"
                className={`px-3 py-2 text-sm font-medium hover:bg-primary-dark rounded ${
                  pathname.startsWith("/admin") ? "bg-primary-dark" : ""
                }`}
              >
                Admin
              </Link>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-white/90">
                  {user.name}
                  <span className="text-white/60"> · {ROLE_LABELS[user.role]}</span>
                </span>
                <form action={logoutAction}>
                  <button className="text-sm bg-primary-dark hover:bg-navy px-3 py-1.5 rounded transition-colors">
                    Log out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm px-3 py-1.5 hover:underline">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-sm bg-gold text-navy font-medium px-3 py-1.5 rounded hover:brightness-105"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-primary-dark px-4 pb-4 space-y-1">
          <Link href="/" className="block py-2 text-sm" onClick={() => setMobileOpen(false)}>
            Home
          </Link>
          <Link href="/calendar" className="block py-2 text-sm" onClick={() => setMobileOpen(false)}>
            Calendar
          </Link>
          {ABOUT_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="block py-2 pl-3 text-sm text-white/90" onClick={() => setMobileOpen(false)}>
              {l.label}
            </Link>
          ))}
          {user &&
            MEMBER_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="block py-2 pl-3 text-sm text-white/90" onClick={() => setMobileOpen(false)}>
                {l.label}
              </Link>
            ))}
          <Link href="/contact" className="block py-2 text-sm" onClick={() => setMobileOpen(false)}>
            Contact Us
          </Link>
          {isAdminish && (
            <Link href="/admin" className="block py-2 text-sm" onClick={() => setMobileOpen(false)}>
              Admin
            </Link>
          )}
          <div className="pt-2 border-t border-white/20 mt-2">
            {user ? (
              <form action={logoutAction}>
                <button className="block w-full text-left py-2 text-sm">Log out ({user.name})</button>
              </form>
            ) : (
              <>
                <Link href="/login" className="block py-2 text-sm" onClick={() => setMobileOpen(false)}>
                  Login
                </Link>
                <Link href="/register" className="block py-2 text-sm" onClick={() => setMobileOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
