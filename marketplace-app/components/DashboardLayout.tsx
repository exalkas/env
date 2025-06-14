"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import DashboardNavigation from "./DashboardNavigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Don't check auth on public pages
    const publicPages = ["/", "/login", "/signup"];
    if (publicPages.includes(pathname)) {
      setAuthLoading(false);
      return;
    }

    // Check authentication for dashboard pages
    if (!loading) {
      if (!user) {
        router.push("/login");
        return;
      }
      setAuthLoading(false);
    }
  }, [user, loading, router, pathname]);

  // Show loading spinner while checking auth
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Don't show navigation on public pages
  const publicPages = ["/", "/login", "/signup"];
  if (publicPages.includes(pathname)) {
    return <>{children}</>;
  }

  // Show navigation for authenticated dashboard pages
  return (
    <div className="flex min-h-screen bg-gray-100">
      <DashboardNavigation />
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
