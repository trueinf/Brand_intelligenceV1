"use client";

import { useState } from "react";
import { AssetVersionCard } from "./AssetVersionCard";
import type { AssetVersion } from "@/types/campaign";

interface AssetVersionStackProps {
  versions: AssetVersion[];
  mode: "image" | "video";
  label: string;
  campaignApiBase: string | null;
  onRegenerate: () => void;
  isRegenerating?: boolean;
  onUpdateVersion: (jobId: string, update: Partial<AssetVersion>) => void;
  imageTypeLabels?: Record<string, string>;
}

export function AssetVersionStack({
  versions,
  mode,
  label,
  campaignApiBase,
  onRegenerate,
  isRegenerating,
  onUpdateVersion,
  imageTypeLabels = {},
}: AssetVersionStackProps) {
  const [expandedIndex, setExpandedIndex] = useState(0);
  const newestFirst = [...versions].reverse();

  if (versions.length === 0) return null;

  return (
    <div className="space-y-2">
      {newestFirst.map((v, i) => (
        <AssetVersionCard
          key={v.jobId}
          jobId={v.jobId}
          mode={mode}
          version={v.version}
          label={i === 0 ? label : `${label} (v${v.version})`}
          campaignApiBase={campaignApiBase}
          initial={{ status: v.status, output: v.output, error: v.error, progress: v.progress }}
          onStatusChange={(update) => onUpdateVersion(v.jobId, update)}
          onRegenerate={onRegenerate}
          isRegenerating={isRegenerating}
          expanded={i === expandedIndex}
          onToggleExpand={() => setExpandedIndex(i)}
          imageTypeLabels={imageTypeLabels}
        />
      ))}
    </div>
  );
}
