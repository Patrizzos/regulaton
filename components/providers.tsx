"use client";
// components/providers.tsx
// NextAuth's SessionProvider must be a client component.
// We wrap it here so the root layout (server component) can import it cleanly.

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
