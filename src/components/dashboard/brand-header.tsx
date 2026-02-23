"use client";

import { motion } from "framer-motion";

import type { BrandContext, BrandOverview } from "@/types";

export interface BrandHeaderProps {
  brandOverview: BrandOverview;
  brandContext?: BrandContext | null;
}

export function BrandHeader({ brandOverview, brandContext }: BrandHeaderProps) {
  const ctx = brandContext;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-card border border-border shadow-sm mb-6"
    >
      {ctx?.logo && (
        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ctx.logo}
            alt=""
            className="w-full h-full object-contain"
          />
        </div>
      )}
      <div className="min-w-0">
        <h2 className="text-lg font-semibold truncate">{brandOverview.name}</h2>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {ctx?.industry != null && <span>{ctx.industry}</span>}
          {ctx?.employeesRange != null && <span>Size: {ctx.employeesRange}</span>}
          {(ctx?.country ?? ctx?.location) != null && (
            <span>{ctx?.country ?? ctx?.location}</span>
          )}
          {ctx == null && brandOverview.industry != null && (
            <span>{brandOverview.industry}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
