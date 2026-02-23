"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import type { BrandDNA as BrandDNAType } from "@/lib/data/mock-dashboard-data";

export interface BrandDNACardProps {
  data: BrandDNAType;
}

export function BrandDNACard({ data }: BrandDNACardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className="rounded-2xl border border-border/80 bg-card/80 shadow-sm shadow-black/5 transition-shadow hover:shadow-md hover:shadow-black/10 hover:border-primary/30">
        <CardHeader className="pb-2">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Brand DNA
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Personality</p>
            <div className="flex flex-wrap gap-1.5">
              {data.brandPersonality.map((trait, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Market position</p>
            <p className="text-sm font-medium text-foreground">{data.marketPosition}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Brand type</p>
            <p className="text-sm font-medium text-foreground">{data.brandType}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
