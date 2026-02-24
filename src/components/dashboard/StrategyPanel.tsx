"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, Loader2, CheckCircle2, AlertCircle, Lightbulb, Check } from "lucide-react";
import type { StrategyPanelData, StrategyInsightItem, VideoStep as VideoStepType } from "@/types/dashboard";
import type { VideoScript } from "@/types/video";
import type { CampaignOutput as CampaignOutputType } from "@/types/campaign";
import { CampaignOutputPanel } from "./CampaignOutputPanel";

const VIDEO_STEPS: VideoStepType[] = [
  { id: "analyzing", label: "Analyzing brand data", done: false, active: false },
  { id: "script", label: "Writing script", done: false, active: false },
  { id: "voiceover", label: "Generating voiceover", done: false, active: false },
  { id: "rendering", label: "Rendering video", done: false, active: false },
];

function PriorityBadge({ priority }: { priority?: StrategyInsightItem["priority"] }) {
  if (!priority) return null;
  const styles = {
    high: "bg-green-500/15 text-green-700 dark:text-green-400",
    medium: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    low: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${styles[priority]}`}>
      {priority}
    </span>
  );
}

function InsightList({
  items,
  iconColor,
}: {
  items: StrategyInsightItem[];
  iconColor: string;
}) {
  return (
    <ul className="space-y-1.5 text-sm text-muted-foreground">
      {items.map((item, i) => {
        const text = typeof item === "string" ? item : item.text;
        const priority = typeof item === "string" ? undefined : item.priority;
        return (
          <li key={i} className="flex items-start gap-2">
            <span className={iconColor}>·</span>
            <span className="flex-1">{text}</span>
            <PriorityBadge priority={priority} />
          </li>
        );
      })}
    </ul>
  );
}

export type CampaignStepIndex = 0 | 1 | 2;

export interface StrategyPanelProps {
  data: StrategyPanelData;
  onGenerateVideo?: () => void;
  videoState: "idle" | "generating" | "ready";
  videoSteps?: VideoStepType[];
  videoScript?: VideoScript | null;
  audioUrl?: string | null;
  videoError?: string | null;
  onGenerateCampaign?: () => void;
  onClearCampaignOutput?: () => void;
  campaignLoading?: boolean;
  campaignStep?: CampaignStepIndex;
  campaignOutput?: CampaignOutputType | null;
  campaignError?: string | null;
  /** Brand name for Brand Kit (posters, video) */
  brandName?: string | null;
}

const CAMPAIGN_STEP_LABELS: string[] = [
  "Strategizing campaign",
  "Generating creatives",
  "Producing ad video",
];

export function StrategyPanel({
  data,
  onGenerateVideo,
  videoState,
  videoSteps = VIDEO_STEPS,
  videoScript,
  audioUrl,
  videoError,
  onGenerateCampaign,
  campaignLoading = false,
  campaignStep = 0,
  campaignOutput,
  campaignError,
  onClearCampaignOutput,
  brandName,
}: StrategyPanelProps) {
  const normalizedWorking = data.whatsWorking.map((i) => (typeof i === "string" ? { text: i } : i));
  const normalizedMissing = data.whatsMissing.map((i) => (typeof i === "string" ? { text: i } : i));
  const normalizedActions = data.recommendedActions.map((i) => (typeof i === "string" ? { text: i } : i));

  return (
    <motion.aside
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="sticky top-4 space-y-4"
    >
      <Card className="rounded-2xl border border-border/80 bg-card/80 shadow-sm shadow-black/5">
        <CardHeader className="pb-2">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Strategy Copilot
          </h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h3 className="text-sm font-medium text-foreground">What&apos;s working</h3>
            </div>
            <InsightList items={normalizedWorking} iconColor="text-green-600" />
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-medium text-foreground">What&apos;s missing</h3>
            </div>
            <InsightList items={normalizedMissing} iconColor="text-amber-600" />
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-medium text-foreground">Recommended actions</h3>
            </div>
            <InsightList items={normalizedActions} iconColor="text-blue-600" />
          </section>

          {/* Campaign / Video section */}
          <section className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <AnimatePresence mode="wait">
              {campaignOutput ? (
                <div className="space-y-2">
                  {onClearCampaignOutput && (
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onClearCampaignOutput}>
                      Generate another campaign
                    </Button>
                  )}
                  <CampaignOutputPanel output={campaignOutput} brandName={brandName} />
                </div>
              ) : campaignLoading ? (
                <motion.div
                  key="campaign-loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <p className="text-sm font-medium text-foreground">Generating next campaign…</p>
                  <ul className="space-y-2">
                    {CAMPAIGN_STEP_LABELS.map((label, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        {i < campaignStep ? (
                          <Check className="h-4 w-4 shrink-0 text-green-600" />
                        ) : i === campaignStep ? (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                        ) : (
                          <span className="h-4 w-4 shrink-0 rounded-full border border-muted-foreground/40" />
                        )}
                        <span className={i <= campaignStep ? "text-foreground" : "text-muted-foreground"}>
                          {label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ) : campaignError ? (
                <div className="text-center">
                  <p className="text-sm text-destructive mb-2">{campaignError}</p>
                  {onGenerateCampaign && (
                    <Button onClick={onGenerateCampaign} variant="outline" size="sm">
                      Try again
                    </Button>
                  )}
                </div>
              ) : videoState === "idle" && (onGenerateCampaign || onGenerateVideo) ? (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <p className="text-sm text-muted-foreground mb-3">
                    {onGenerateCampaign
                      ? "Generate a data-driven campaign with ad creatives and video."
                      : "Generate a strategy video from this brand intelligence."}
                  </p>
                  {onGenerateCampaign && (
                    <Button onClick={onGenerateCampaign} className="w-full rounded-xl mb-2" size="lg">
                      <Megaphone className="h-4 w-4" />
                      Generate Next Campaign
                    </Button>
                  )}
                  {onGenerateVideo && (
                    <Button onClick={onGenerateVideo} variant="outline" className="w-full rounded-xl" size="lg">
                      Strategy video
                    </Button>
                  )}
                </motion.div>
              ) : null}
              {videoState === "generating" && !campaignOutput && (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <p className="text-sm font-medium text-foreground">Generating…</p>
                  <ul className="space-y-2">
                    {videoSteps.map((step) => (
                      <li key={step.id} className="flex items-center gap-2 text-sm">
                        {step.done ? (
                          <Check className="h-4 w-4 shrink-0 text-green-600" />
                        ) : step.active ? (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                        ) : (
                          <span className="h-4 w-4 shrink-0 rounded-full border border-muted-foreground/40" />
                        )}
                        <span className={step.done ? "text-muted-foreground" : "text-foreground"}>
                          {step.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </CardContent>
      </Card>
    </motion.aside>
  );
}
