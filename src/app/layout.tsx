"use client";
import { SessionProvider, useSession } from "next-auth/react";
import type React from "react";
import { usePathname } from "next/navigation";
import { UserSidebar } from "@/components/layout/UserSidebar";

function InnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = !!session && status === "authenticated";
  const isAdminPage = pathname.startsWith("/admin");
  return (
    <>
      {isAuthenticated && !isAdminPage && <UserSidebar />}
      <div style={{ marginLeft: isAuthenticated && !isAdminPage ? 250 : 0 }}>
        {children}
      </div>
    </>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <SessionProvider>
          <InnerLayout>{children}</InnerLayout>
        </SessionProvider>
      </body>
    </html>
  );
}
