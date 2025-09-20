"use client";
import { useEffect, ReactNode } from "react";
import { useSidebarVisibility } from "./SidebarVisibilityContext";

export default function NoSidebar({ children }: { children: ReactNode }) {
  const { setHidden } = useSidebarVisibility();
  useEffect(() => {
    setHidden(true);
    return () => setHidden(false);
  }, [setHidden]);

  return <>{children}</>;
}
