import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/api/auth", "/403"];

const rolePaths: Record<string, string[]> = {
  Admin: ["/admin"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  if (isPublicPath) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRoles = (token.roles as string[]) || [];
  const requiredRoles: string[] = [];

  for (const [role, paths] of Object.entries(rolePaths)) {
    for (const path of paths) {
      if (pathname.startsWith(path)) {
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
  matcher: ["/", "/admin/:path*", "/projects/:path*"],
};
