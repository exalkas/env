"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated, isAdmin } from "../lib/utils/auth";
import Navigation from "./Navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Don't check auth on login page
    if (pathname === "/login") {
      setLoading(false);
      return;
    }

    // Check authentication and admin status
    if (!isAuthenticated() || !isAdmin()) {
      router.push("/login");
      return;
    }

    setLoading(false);
  }, [router, pathname]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Don't show navigation on login page
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Show navigation for authenticated admin pages
  return (
    <div className="flex min-h-screen bg-gray-100 relative">
      <Navigation />
      <main className="flex-1 overflow-auto min-w-0">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
