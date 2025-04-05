import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { compare } from "bcrypt";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        nickname: { label: "Nickname", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.nickname || !credentials?.password) {
          throw new Error("Missing nickname or password");
        }

        const user = await prisma.user.findUnique({
          where: {
            nickname: credentials.nickname,
          },
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        });

        if (!user) {
          throw new Error("User not found");
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password_hash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        const roles = user.roles.map((roleUser) => roleUser.role.name);
        const passwordChanged = user.password_changed;

        return {
          id: user.id.toString(),
          name: user.nickname,
          roles,
          passwordChanged,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
        token.passwordChanged = user.passwordChanged;
        console.log("JWT Callback - User roles:", user.roles);
        console.log("Password Changed: ", user.passwordChanged);
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          roles: token.roles as string[],
          passwordChanged: token.passwordChanged as boolean,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
