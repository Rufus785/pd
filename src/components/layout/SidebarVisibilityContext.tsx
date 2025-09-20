"use client";
import { createContext, useContext, useState, useMemo, ReactNode } from "react";

type Ctx = { hidden: boolean; setHidden: (v: boolean) => void };
const SidebarVisibilityContext = createContext<Ctx | null>(null);

export function SidebarVisibilityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [hidden, setHidden] = useState(false);
  const value = useMemo(() => ({ hidden, setHidden }), [hidden]);
  return (
    <SidebarVisibilityContext.Provider value={value}>
      {children}
    </SidebarVisibilityContext.Provider>
  );
}

export function useSidebarVisibility() {
  const ctx = useContext(SidebarVisibilityContext);
  if (!ctx)
    throw new Error(
      "useSidebarVisibility must be used within SidebarVisibilityProvider"
    );
  return ctx;
}
