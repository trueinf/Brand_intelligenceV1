"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { PosterPreview } from "./PosterPreview";
import type { CampaignOutput as CampaignOutputType } from "@/types/campaign";

export interface CampaignOutputPanelProps {
  output: CampaignOutputType;
  /** Brand name for Brand Kit (poster composer, etc.) */
  brandName?: string | null;
}

const AD_TYPE_LABELS: Record<string, string> = {
  social_post: "Social post",
  banner: "Banner",
  product_focus: "Product focus",
};

export function CampaignOutputPanel({ output, brandName }: CampaignOutputPanelProps) {
  const { brief, adImages, videoUrl, videoError } = output;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card className="rounded-2xl border border-border/80 bg-card/80 shadow-sm">
        <CardHeader className="pb-2">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Campaign output
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Campaign concept</p>
            <p className="text-sm text-foreground mt-0.5">{brief.campaignConcept}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Target audience</p>
            <p className="text-sm text-foreground mt-0.5">{brief.targetAudience}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Key message</p>
            <p className="text-sm text-foreground mt-0.5">{brief.keyMessage}</p>
          </div>

          {adImages.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Generated ad images</p>
              <div className="grid grid-cols-1 gap-2">
                {adImages.map((img) => (
                  <div key={img.type} className="rounded-lg overflow-hidden border border-border/60">
                    <a href={img.url} target="_blank" rel="noreferrer" className="block">
                      <img
                        src={img.url}
                        alt={AD_TYPE_LABELS[img.type] ?? img.type}
                        className="w-full h-auto object-cover max-h-40"
                      />
                    </a>
                    <p className="p-1.5 text-xs text-muted-foreground">
                      {AD_TYPE_LABELS[img.type] ?? img.type}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <PosterPreview
              imageUrl={adImages[0]?.url}
              campaignBrief={brief}
              brandName={brandName}
            />
          </div>

          {videoUrl ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Ad video</p>
              <div className="rounded-lg overflow-hidden border border-border/60 bg-black/90">
                <video
                  src={videoUrl}
                  controls
                  className="w-full aspect-video"
                  preload="metadata"
                />
              </div>
              <a
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs text-primary hover:underline"
              >
                Open in new tab
              </a>
            </div>
          ) : (
            <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
              {videoError ? (
                <p className="text-xs text-muted-foreground">
                  Ad video failed: <span className="text-destructive">{videoError}</span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Ad video was not generated. Set <strong>RUNWAY_API_KEY</strong> in the environment where the campaign worker runs (e.g. Render or .env) and redeploy. You can also use &quot;Generate campaign video (10–20s)&quot; from a campaign workspace for video.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
