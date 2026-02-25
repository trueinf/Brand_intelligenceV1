"use client";

import {
  Award,
  TrendingUp,
  DollarSign,
  Target,
  ImageIcon,
} from "lucide-react";
import type { AnalyzeBrandResponse, TrafficTrendPoint } from "@/types";
import { KPICard } from "./KPICard";

const SPARKLINE_POINTS = 12;

function trendFromTraffic(trend: TrafficTrendPoint[]): number[] {
  const raw = trend
    .slice(-SPARKLINE_POINTS)
    .map((p) => p.traffic ?? p.value ?? p.total ?? (p.organic ?? 0) + (p.paid ?? 0));
  return raw.length > 0 ? raw : [];
}

export interface KPIRowProps {
  result: AnalyzeBrandResponse;
  assetCount?: number;
}

export function KPIRow({ result, assetCount = 0 }: KPIRowProps) {
  const synthetic = result.synthetic_data;
  const channelMix = synthetic?.channel_mix;
  const trafficTrend = result.traffic_trend ?? synthetic?.traffic_trend ?? [];

  const totalChannel = channelMix
    ? channelMix.organic + channelMix.paid + channelMix.social + channelMix.direct
    : 0;
  const organicPct =
    totalChannel > 0 && channelMix
      ? Math.round((channelMix.organic / totalChannel) * 100)
      : null;
  const paidPct =
    totalChannel > 0 && channelMix
      ? Math.round((channelMix.paid / totalChannel) * 100)
      : null;

  const brandScore =
    result.insights?.growth_score ??
    synthetic?.domain_overview?.authority_score ??
    null;
  const avgSuccess =
    result.campaigns?.length > 0
      ? Math.round(
          result.campaigns.reduce((s, c) => s + (c.success_score ?? 0), 0) /
            result.campaigns.length
        )
      : null;

  const sparkline = trendFromTraffic(trafficTrend);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <KPICard
        icon={<Award className="h-4 w-4" />}
        label="Brand score"
        value={brandScore != null ? brandScore : "—"}
        sparkline={sparkline.length > 0 ? sparkline : undefined}
      />
      <KPICard
        icon={<TrendingUp className="h-4 w-4" />}
        label="Organic traffic %"
        value={organicPct != null ? `${organicPct}%` : "—"}
        sparkline={sparkline.length > 0 ? sparkline : undefined}
      />
      <KPICard
        icon={<DollarSign className="h-4 w-4" />}
        label="Paid traffic %"
        value={paidPct != null ? `${paidPct}%` : "—"}
        sparkline={sparkline.length > 0 ? sparkline : undefined}
      />
      <KPICard
        icon={<Target className="h-4 w-4" />}
        label="Avg campaign success"
        value={avgSuccess != null ? avgSuccess : "—"}
        sparkline={sparkline.length > 0 ? sparkline : undefined}
      />
      <KPICard
        icon={<ImageIcon className="h-4 w-4" />}
        label="Asset performance"
        value={assetCount}
        sparkline={sparkline.length > 0 ? sparkline : undefined}
      />
    </div>
  );
}
