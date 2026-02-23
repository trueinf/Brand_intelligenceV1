"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CampaignTheme } from "@/types/dashboard";

export interface CampaignDetailModalProps {
  campaign: CampaignTheme | null;
  open: boolean;
  onClose: () => void;
}

export function CampaignDetailModal({ campaign, open, onClose }: CampaignDetailModalProps) {
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
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "tween", duration: 0.2 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Campaign detail</h2>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
            {campaign && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Channel</p>
                  <p className="text-foreground font-medium">{campaign.channel}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Objective</p>
                  <p className="text-foreground font-medium">{campaign.objective ?? campaign.goal}</p>
                </div>
                {campaign.performance && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Performance</p>
                    <p className="text-foreground">{campaign.performance}</p>
                  </div>
                )}
                {campaign.messaging && campaign.messaging.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Messaging</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
                      {campaign.messaging.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="pt-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      campaign.status === "Active"
                        ? "bg-green-500/15 text-green-700 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {campaign.status}
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
