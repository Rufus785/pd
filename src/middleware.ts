import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const rolePaths: Record<string, string[]> = {
  Admin: ["/admin"],
};

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const userRoles = (token.roles as string[]) || [];

  let requiredRoles: string[] = [];

  for (const [role, paths] of Object.entries(rolePaths)) {
    for (const path of paths) {
      if (request.nextUrl.pathname.startsWith(path)) {
        requiredRoles.push(role);
      }
    }
  }

  if (requiredRoles.length > 0) {
    const hasAccess = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasAccess) {
      return NextResponse.redirect(new URL("/403", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
