"use client";

import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import type { GrowthDataPoint } from "@/lib/data/mock-dashboard-data";

export interface GrowthChartProps {
  data: GrowthDataPoint[];
  yoYPercent: number;
}

export function GrowthChart({ data, yoYPercent }: GrowthChartProps) {
  const isPositive = yoYPercent >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className="rounded-2xl border border-border/80 bg-card/80 shadow-sm shadow-black/5 transition-shadow hover:shadow-md hover:shadow-black/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Growth Signal
          </h3>
          <span
            className={`text-sm font-semibold ${isPositive ? "text-green-600" : "text-amber-600"}`}
          >
            {isPositive ? "+" : ""}{yoYPercent}% YoY
          </span>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="h-[160px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "0.5rem",
                    border: "1px solid var(--border)",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [value, "Score"]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--green-500, #22c55e)"
                  strokeWidth={2}
                  dot={{ fill: "var(--green-500)", r: 3 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
