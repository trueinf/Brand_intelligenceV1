"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { YouTubeCreative } from "@/types";

export interface YouTubeCreativesCardProps {
  creatives: YouTubeCreative[];
}

export function YouTubeCreativesCard({ creatives }: YouTubeCreativesCardProps) {
  if (!creatives?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
    >
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Active campaign creatives
          </h3>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {creatives.map((c, i) => (
              <a
                key={i}
                href={c.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
              >
                <div className="aspect-video bg-muted relative">
                  {c.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.thumbnail}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
                      No thumb
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium line-clamp-2">{c.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {typeof c.views === "number"
                      ? `${(c.views / 1000).toFixed(1)}K views`
                      : c.views}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
