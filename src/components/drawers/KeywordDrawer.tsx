"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { KeywordCluster } from "@/types/dashboard";

export interface KeywordDrawerProps {
  cluster: KeywordCluster | null;
  open: boolean;
  onClose: () => void;
}

export function KeywordDrawer({ cluster, open, onClose }: KeywordDrawerProps) {
  useEffect(() => {
    if (open) {
      const onEscape = (e: KeyboardEvent) => e.key === "Escape" && onClose();
      document.addEventListener("keydown", onEscape);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", onEscape);
        document.body.style.overflow = "";
      };
    }
  }, [open, onClose]);

  const opportunityScore = cluster?.opportunityScore ?? (cluster?.volume ? Math.min(100, Math.round((cluster.volume / 15000) * 100)) : undefined);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-lg font-semibold text-foreground">Keyword cluster</h2>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {cluster && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Intent</p>
                    <p className="text-lg font-semibold text-foreground capitalize">
                      {cluster.intent ?? cluster.label}
                    </p>
                  </div>
                  {cluster.volume != null && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Volume</p>
                      <p className="text-2xl font-semibold text-foreground">
                        {cluster.volume.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {opportunityScore != null && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Opportunity score</p>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${opportunityScore}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <p className="mt-1 text-sm font-medium text-foreground">{opportunityScore}/100</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Full keyword list</p>
                    <ul className="flex flex-wrap gap-2">
                      {cluster.keywords.map((kw, i) => (
                        <li
                          key={i}
                          className="rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground"
                        >
                          {kw}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
