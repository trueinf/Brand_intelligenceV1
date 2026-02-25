"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LayoutDashboard, Megaphone, Sparkles, Image, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/dashboard/search-bar";
import { Button } from "@/components/ui/button";

export type AppSection = "overview" | "campaigns" | "asset-studio" | "assets-library" | "insights";

const SIDEBAR_ITEMS: { id: AppSection; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: "campaigns", label: "Campaigns", icon: <Megaphone className="h-5 w-5" /> },
  { id: "asset-studio", label: "Asset Studio", icon: <Sparkles className="h-5 w-5" /> },
  { id: "assets-library", label: "Assets Library", icon: <Image className="h-5 w-5" /> },
  { id: "insights", label: "Insights", icon: <Lightbulb className="h-5 w-5" /> },
];

interface AppShellProps {
  children: React.ReactNode;
  activeSection: AppSection;
  onSectionChange: (section: AppSection) => void;
  onSearch: (value: string) => void;
  isSearchLoading?: boolean;
  searchError?: string | null;
  onGenerateAsset: () => void;
  title?: string;
}

export function AppShell({
  children,
  activeSection,
  onSectionChange,
  onSearch,
  isSearchLoading,
  searchError,
  onGenerateAsset,
  title = "Brand Campaign Intelligence",
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar - desktop */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:w-56 lg:shrink-0 lg:fixed lg:inset-y-0 z-30",
          "border-r border-border bg-card/50 backdrop-blur",
          "transition-[width] ease-out"
        )}
      >
        <div className="flex h-14 items-center gap-2 px-4 border-b border-border">
          <span className="font-semibold text-slate-900 dark:text-white truncate">{title}</span>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                activeSection === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-slate-600 dark:text-slate-300 hover:bg-muted hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-hidden
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-border bg-card backdrop-blur lg:hidden transition-transform ease-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between px-4 border-b border-border">
          <span className="font-semibold text-slate-900 dark:text-white">{title}</span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-muted hover:text-slate-900 dark:hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSectionChange(item.id);
                setSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                activeSection === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-slate-600 dark:text-slate-300 hover:bg-muted hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col lg:pl-56 min-w-0">
        {/* Sticky header */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 text-slate-900 dark:text-white">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-muted hover:text-slate-900 dark:hover:text-white"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <SearchBar onSearch={onSearch} isLoading={isSearchLoading} className="max-w-md flex-1" />
          </div>
          <Button onClick={onGenerateAsset} className="btn-gradient shrink-0">
            Generate Asset
          </Button>
          <Link
            href="/assets"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-muted hover:text-slate-900 dark:hover:text-white shrink-0"
          >
            <Image className="h-4 w-4" />
            Assets
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          {searchError && (
            <p className="mb-4 text-sm text-destructive">{searchError}</p>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
