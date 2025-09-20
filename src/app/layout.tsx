"use client";
import { SessionProvider, useSession } from "next-auth/react";
import type React from "react";
import { usePathname } from "next/navigation";
import { UserSidebar } from "@/components/layout/UserSidebar";
import {
  SidebarVisibilityProvider,
  useSidebarVisibility,
} from "@/components/layout/SidebarVisibilityContext";

function InnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = !!session && status === "authenticated";
  const isAdminPage = pathname.startsWith("/admin");

  const { hidden } = useSidebarVisibility();

  const showSidebar = isAuthenticated && !isAdminPage && !hidden;

  return (
    <>
      {showSidebar && <UserSidebar />}
      <div style={{ marginLeft: showSidebar ? 250 : 0 }}>{children}</div>
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
          <SidebarVisibilityProvider>
            <InnerLayout>{children}</InnerLayout>
          </SidebarVisibilityProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
