"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export interface MessagingStrategyCardProps {
  summary: string;
}

export function MessagingStrategyCard({ summary }: MessagingStrategyCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className="rounded-2xl border border-border/80 bg-card/80 shadow-sm shadow-black/5 transition-shadow hover:shadow-md hover:shadow-black/10">
        <CardHeader className="pb-2">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Messaging Strategy
          </h3>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
            <MessageSquare className="h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm leading-relaxed text-foreground">{summary}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
