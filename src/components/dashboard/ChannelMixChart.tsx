"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import type { ChannelMixData } from "@/lib/data/mock-dashboard-data";

export interface ChannelMixChartProps {
  data: ChannelMixData[];
}

const DEFAULT_COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b"];

export function ChannelMixChart({ data }: ChannelMixChartProps) {
  const chartData = data.map((d, i) => ({
    ...d,
    color: d.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className="rounded-2xl border border-border/80 bg-card/80 shadow-sm shadow-black/5 transition-shadow hover:shadow-md hover:shadow-black/10">
        <CardHeader className="pb-2">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Channel Mix
          </h3>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="h-[220px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "0.5rem",
                    border: "1px solid var(--border)",
                    fontSize: "12px",
                  }}
                  formatter={(value: number | undefined, name?: string) => [`${value ?? 0}%`, name ?? ""]}
                />
                <Legend
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  formatter={(value, entry) => (
                    <span className="text-xs text-muted-foreground">
                      {value} {(entry?.payload?.value ?? 0)}%
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
