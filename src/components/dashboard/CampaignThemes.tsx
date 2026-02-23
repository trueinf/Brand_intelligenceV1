"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import type { CampaignTheme as CampaignThemeType } from "@/types/dashboard";

export interface CampaignThemesProps {
  themes: CampaignThemeType[];
  onThemeClick?: (theme: CampaignThemeType) => void;
}

export function CampaignThemes({ themes, onThemeClick }: CampaignThemesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.35 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className="rounded-2xl border border-border/80 bg-card/80 shadow-sm shadow-black/5 transition-shadow hover:shadow-md hover:shadow-black/10 hover:border-primary/30">
        <CardHeader className="pb-2">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Active Campaign Themes
          </h3>
        </CardHeader>
        <CardContent className="space-y-2">
          {themes.map((theme, i) => (
            <motion.button
              key={theme.id}
              type="button"
              onClick={() => onThemeClick?.(theme)}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{theme.campaignType}</p>
                <p className="text-xs text-muted-foreground">
                  {theme.channel} · {theme.goal}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  theme.status === "Active"
                    ? "bg-green-500/15 text-green-700 dark:text-green-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {theme.status}
              </span>
            </motion.button>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
