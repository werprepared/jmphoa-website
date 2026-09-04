import type { Role, MemberStatus } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
    status: MemberStatus;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      status: MemberStatus;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    status: MemberStatus;
  }
}
