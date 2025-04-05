"use client";
import { useSession } from "next-auth/react";

export default function DisplayIfAdmin({
  adminOnly,
  children,
}: Readonly<{
  adminOnly: boolean;
  children: React.ReactNode;
}>) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (adminOnly && !session?.user?.roles?.includes("Admin")) {
    return null;
  }

  return <>{children}</>;
}
