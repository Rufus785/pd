import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { NextRequest } from "next/server";

const handler = NextAuth(authOptions);

export function GET(req: NextRequest) {
  return handler(req);
}

export function POST(req: NextRequest) {
  return handler(req);
}
