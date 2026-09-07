import type { Role, MemberStatus } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    roles: Role[];
    status: MemberStatus;
  }

  interface Session {
    user: {
      id: string;
      roles: Role[];
      status: MemberStatus;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    roles: Role[];
    status: MemberStatus;
  }
}
