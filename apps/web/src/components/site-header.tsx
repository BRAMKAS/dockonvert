"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { Menu, X, LogOut, LayoutDashboard, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";

const NAV_ITEMS = [
  { href: "/docs", label: "API Docs" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/releases", label: "Releases" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, loadFromStorage } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    loadFromStorage();
    setMounted(true);
  }, [loadFromStorage]);

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo className="h-8 w-8" />
          <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">by BRAMKAS</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {mounted && user ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <div className="flex items-center gap-2 rounded-full border px-3 py-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                  {user.name?.charAt(0)?.toUpperCase() || <User className="h-3 w-3" />}
                </div>
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1 h-4 w-4" />
                Sign out
              </Button>
            </>
          ) : mounted ? (
            <>
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/login" />}>
                Sign in
              </Button>
              <Button size="sm" nativeButton={false} render={<Link href="/register" />}>
                Get API Key
              </Button>
            </>
          ) : null}
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-b bg-background px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {mounted && user ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
                <div className="mt-2 flex items-center gap-2 px-3 py-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                    {user.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <span className="text-sm">{user.name}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => { handleLogout(); setMobileOpen(false); }}>
                  <LogOut className="mr-1 h-4 w-4" /> Sign out
                </Button>
              </>
            ) : mounted ? (
              <div className="mt-2 flex flex-col gap-2">
                <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/login" />}>
                  Sign in
                </Button>
                <Button size="sm" nativeButton={false} render={<Link href="/register" />}>
                  Get API Key
                </Button>
              </div>
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}
