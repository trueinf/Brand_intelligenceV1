"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import type { KeywordCluster } from "@/types/dashboard";

export interface KeywordClustersProps {
  clusters: KeywordCluster[];
  onClusterClick?: (cluster: KeywordCluster) => void;
}

export function KeywordClusters({ clusters, onClusterClick }: KeywordClustersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.25 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className="rounded-2xl border border-border/80 bg-card/80 shadow-sm shadow-black/5 transition-shadow hover:shadow-md hover:shadow-black/10 hover:border-primary/30">
        <CardHeader className="pb-2">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Keyword Theme Clusters
          </h3>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {clusters.map((cluster) => (
                <motion.button
                  key={cluster.id}
                  type="button"
                  onClick={() => onClusterClick?.(cluster)}
                  className="rounded-xl border border-border/80 bg-muted/30 px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="font-medium">{cluster.label}</span>
                  {cluster.volume != null && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {cluster.volume.toLocaleString()}
                    </span>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {cluster.keywords.slice(0, 3).map((kw, i) => (
                      <span
                        key={i}
                        className="rounded bg-muted/80 px-1.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
