"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  LayoutGrid,
  FolderOpen,
  Search,
  Download,
  Calendar,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaign-studio", label: "Campaign Studio", icon: LayoutGrid },
  { href: "/assets", label: "Assets", icon: FolderOpen },
];

export interface DashboardShellProps {
  children: React.ReactNode;
  topBar: {
    brandName: string;
    brandLogo?: string;
    dateRange: { from: string; to: string };
    onSearch: (query: string) => void;
    searchLoading?: boolean;
    analyzingBrand?: string | null;
    onExport?: () => void;
  };
}

export function DashboardShell({ children, topBar }: DashboardShellProps) {
  const pathname = usePathname();
  const { brandName, dateRange, onSearch, searchLoading, analyzingBrand, onExport } = topBar;
  const isLoading = searchLoading || !!analyzingBrand;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left sidebar */}
      <motion.aside
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed left-0 top-0 z-30 flex w-56 flex-col border-r border-border bg-card/80 backdrop-blur"
      >
        <div className="flex h-14 items-center border-b border-border px-4">
          <span className="text-sm font-semibold text-foreground">Brand Intelligence</span>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <motion.span
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </motion.span>
              </Link>
            );
          })}
        </nav>
      </motion.aside>

      {/* Main + top bar */}
      <div className="flex flex-1 flex-col pl-56">
        {/* Top bar */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-card/60 px-6 backdrop-blur"
        >
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-4">
              <div className="relative w-64 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search brand..."
                  className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-70"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const q = (e.target as HTMLInputElement).value.trim();
                      if (q) onSearch(q);
                    }
                  }}
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-center gap-2 border-l border-border pl-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                  {(analyzingBrand || brandName).slice(0, 1).toUpperCase() || "—"}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {analyzingBrand ? `Analyzing ${analyzingBrand}…` : brandName || "—"}
                </span>
              </div>
            </div>
            {analyzingBrand && (
              <div className="h-1 w-64 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">
                {dateRange.from.slice(0, 7)} – {dateRange.to.slice(0, 7)}
              </span>
            </button>
            {onExport && (
              <button
                type="button"
                onClick={onExport}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </motion.header>

        <main className={`flex-1 p-6 ${isLoading ? "pointer-events-none opacity-90" : ""}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
