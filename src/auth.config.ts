import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe config shared by middleware and the full server config (auth.ts).
 * No providers or database calls here - middleware runs on the Edge runtime
 * and can't use Prisma/bcrypt. Both the jwt and session callbacks here only
 * read/write fields already on the token, so they're safe to share: without
 * this session callback, middleware's own NextAuth instance would use the
 * *default* session callback, which drops custom fields like role/status,
 * making every approved user look unapproved to route-protection checks.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      // Only set on sign-in (`user` is only passed then). Role/status
      // changes an admin makes take effect the next time this user logs
      // in - see the note in /admin/users.
      if (user) {
        token.id = user.id!;
        token.roles = user.roles;
        token.status = user.status;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.roles = token.roles;
        session.user.status = token.status;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
