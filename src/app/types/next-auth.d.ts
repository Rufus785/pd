import NextAuth from "next-auth";
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";
declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    roles?: string[];
    passwordChanged: boolean;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      roles?: string[];
      passwordChanged: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles?: string[];
  }
}
