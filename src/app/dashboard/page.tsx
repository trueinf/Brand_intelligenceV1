"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardProvider, useDashboard } from "@/context/dashboard-context";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BrandDNACard } from "@/components/dashboard/BrandDNACard";
import { StrengthScoreCard } from "@/components/dashboard/StrengthScoreCard";
import { GrowthChart } from "@/components/dashboard/GrowthChart";
import { ChannelMixChart } from "@/components/dashboard/ChannelMixChart";
import { DemandVsBrandChart } from "@/components/dashboard/DemandVsBrandChart";
import { KeywordClusters } from "@/components/dashboard/KeywordClusters";
import { ContentOpportunityCard } from "@/components/dashboard/ContentOpportunityCard";
import { CampaignThemes } from "@/components/dashboard/CampaignThemes";
import { MessagingStrategyCard } from "@/components/dashboard/MessagingStrategyCard";
import { StrategyPanel } from "@/components/dashboard/StrategyPanel";
import { KeywordDrawer } from "@/components/drawers/KeywordDrawer";
import { CampaignDetailModal } from "@/components/modals/CampaignDetailModal";
import { CardSkeleton } from "@/components/skeletons/CardSkeleton";
import { ChartSkeleton } from "@/components/skeletons/ChartSkeleton";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw } from "lucide-react";
import type { VideoStep as VideoStepType } from "@/types/dashboard";
import { type VideoScript, isVideoSceneArray } from "@/types/video";
import type { CampaignOutput } from "@/types/campaign";
import type { CampaignStepIndex } from "@/components/dashboard/StrategyPanel";
import { getMockDashboardData } from "@/lib/data/mock-dashboard-data";

const VIDEO_STEP_IDS: VideoStepType["id"][] = ["analyzing", "script", "voiceover", "rendering"];

function DashboardContent() {
  const { status, loading, error, data, apiResult, analyzingBrand, search, retry } = useDashboard();
  const [videoScript, setVideoScript] = useState<VideoScript | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoState, setVideoState] = useState<"idle" | "generating" | "ready">("idle");
  const [videoSteps, setVideoSteps] = useState<VideoStepType[]>([]);
  const [keywordDrawerOpen, setKeywordDrawerOpen] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<ReturnType<typeof getMockDashboardData>["keywordClusters"][0] | null>(null);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<ReturnType<typeof getMockDashboardData>["campaignThemes"][0] | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignStep, setCampaignStep] = useState<CampaignStepIndex>(0);
  const [campaignOutput, setCampaignOutput] = useState<CampaignOutput | null>(null);
  const [campaignError, setCampaignError] = useState<string | null>(null);

  const dashboardData = data ?? getMockDashboardData();
  const brandName = apiResult?.brand_overview?.name ?? data?.brandName ?? dashboardData.brandName;

  const handleGenerateVideo = useCallback(async () => {
    const payload = apiResult ?? (data ? {
      brand_overview: { name: data.brandName, domain: "", summary: "" },
      campaigns: [],
      insights: {} as import("@/types").AnalyzeBrandResponse["insights"],
    } : null);
    if (!payload) return;
    setVideoState("generating");
    setVideoError(null);
    const stepLabels: Record<VideoStepType["id"], string> = {
      analyzing: "Analyzing brand data",
      script: "Writing script",
      voiceover: "Generating voiceover",
      rendering: "Rendering video",
    };
    const steps: VideoStepType[] = VIDEO_STEP_IDS.map((id, i) => ({
      id,
      label: stepLabels[id],
      done: false,
      active: i === 0,
    }));
    setVideoSteps(steps);
    const tick = (index: number) => {
      setVideoSteps((prev) =>
        prev.map((s, i) => ({
          ...s,
          done: i < index,
          active: i === index,
        }))
      );
    };
    tick(1);
    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardData: payload }),
      });
      let json: { title?: string; scenes?: unknown[]; audioUrl?: string; audioBase64?: string; error?: string };
      try {
        json = await res.json();
      } catch {
        setVideoError(res.status === 504 ? "Request timed out. Try again." : "Video generation failed (invalid response).");
        setVideoState("idle");
        return;
      }
      tick(2);
      if (!res.ok) {
        setVideoError(res.status === 504 ? "Request timed out. Try again." : json.error ?? "Video generation failed");
        setVideoState("idle");
        return;
      }
      tick(3);
      if (json.title && isVideoSceneArray(json.scenes)) {
        setVideoScript({ title: json.title, scenes: json.scenes });
        if (json.audioUrl) {
          setAudioUrl(json.audioUrl);
        } else if (json.audioBase64) {
          const bytes = Uint8Array.from(atob(json.audioBase64), (c) => c.charCodeAt(0));
          setAudioUrl(URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" })));
        }
        setVideoSteps((prev) => prev.map((s) => ({ ...s, done: true, active: false })));
        setVideoState("ready");
      } else setVideoState("idle");
    } catch (e) {
      setVideoError(e instanceof Error ? e.message : "Request failed");
      setVideoState("idle");
    }
  }, [apiResult, data]);

  const campaignApiBase = typeof process.env.NEXT_PUBLIC_CAMPAIGN_API_URL === "string"
    ? process.env.NEXT_PUBLIC_CAMPAIGN_API_URL.replace(/\/$/, "")
    : null;

  const handleGenerateCampaign = useCallback(async () => {
    setCampaignLoading(true);
    setCampaignError(null);
    setCampaignOutput(null);
    setCampaignStep(1);
    const input = {
      brandName: dashboardData.brandName,
      brandOverview: apiResult?.brand_overview
        ? { name: apiResult.brand_overview.name, domain: apiResult.brand_overview.domain, summary: apiResult.brand_overview.summary }
        : { name: dashboardData.brandName, domain: "", summary: "" },
      keywordIntelligence: {
        coreKeywords: dashboardData.keywordClusters?.flatMap((c) => c.keywords).slice(0, 15),
        intentClusters: dashboardData.keywordClusters?.map((c) => ({ intent: c.label, keywords: c.keywords })),
      },
      strategyInsights: {
        strategic_summary: dashboardData.messagingStrategy,
        market_position: dashboardData.brandDNA.marketPosition,
        growth_score: dashboardData.strengthScore.score,
        channel_strategy_summary: dashboardData.strategyPanel.recommendedActions?.[0] && typeof dashboardData.strategyPanel.recommendedActions[0] === "object"
          ? (dashboardData.strategyPanel.recommendedActions[0] as { text?: string }).text
          : undefined,
      },
      campaignsSummary: dashboardData.campaignThemes?.map((t) => `${t.campaignType}: ${t.goal}`).join("; "),
    };
    try {
      if (campaignApiBase) {
        const res = await fetch(`${campaignApiBase}/generate-campaign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const json = (await res.json().catch(() => ({}))) as CampaignOutput & { error?: string };
        if (!res.ok) {
          setCampaignError((json as { error?: string }).error ?? "Failed to generate campaign");
          setCampaignLoading(false);
          return;
        }
        if (json.brief) {
          const adImages = (json.adImages ?? []).map((img: { type: string; url: string }) => ({
            type: img.type,
            url:
              img.url.startsWith("http") || img.url.startsWith("data:")
                ? img.url
                : `${campaignApiBase}${img.url.startsWith("/") ? "" : "/"}${img.url}`,
          }));
          setCampaignStep(2);
          setCampaignOutput({
            brief: json.brief,
            adImages,
            videoUrl: json.videoUrl ?? null,
            videoError: json.videoError ?? undefined,
          });
        }
        setCampaignLoading(false);
        return;
      }

      const res = await fetch("/api/generate-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const postJson = (await res.json().catch(() => ({}))) as { jobId?: string; error?: string };
      if (!res.ok) {
        setCampaignError(postJson.error ?? "Failed to start campaign generation");
        setCampaignLoading(false);
        return;
      }
      const jobId = postJson.jobId;
      if (!jobId) {
        setCampaignError("No job ID returned");
        setCampaignLoading(false);
        return;
      }
      const pollInterval = 2000;
      const poll = async () => {
        try {
          const statusRes = await fetch(`/api/campaign-status?jobId=${encodeURIComponent(jobId)}`);
          const statusJson = (await statusRes.json().catch(() => ({}))) as {
            status?: string;
            output?: CampaignOutput;
            error?: string;
          };
          if (statusRes.status === 404) {
            setCampaignError("Job not found or expired");
            setCampaignLoading(false);
            return true;
          }
          if (!statusRes.ok) {
            setCampaignError((statusJson as { error?: string }).error ?? "Failed to get status");
            setCampaignLoading(false);
            return true;
          }
          const status = statusJson.status;
          if (status === "completed" && statusJson.output) {
            setCampaignStep(2);
            setCampaignOutput(statusJson.output);
            setCampaignLoading(false);
            return true;
          }
          if (status === "failed") {
            setCampaignError(statusJson.error ?? "Campaign generation failed");
            setCampaignLoading(false);
            return true;
          }
          return false;
        } catch {
          return false;
        }
      };
      let done = await poll();
      if (done) return;
      const intervalId = setInterval(async () => {
        done = await poll();
        if (done) clearInterval(intervalId);
      }, pollInterval);
    } catch (e) {
      setCampaignError(e instanceof Error ? e.message : "Campaign generation failed");
      setCampaignLoading(false);
    }
  }, [dashboardData, apiResult, campaignApiBase]);

  const memoizedGrowthChart = useMemo(() => dashboardData.growthChart, [dashboardData.growthChart]);
  const memoizedChannelMix = useMemo(() => dashboardData.channelMix, [dashboardData.channelMix]);
  const memoizedDemandVsBrand = useMemo(() => dashboardData.demandVsBrand, [dashboardData.demandVsBrand]);

  if (status === "empty") {
    return (
      <DashboardShell
        topBar={{
          brandName: "",
          dateRange: dashboardData.dateRange,
          onSearch: search,
          analyzingBrand: null,
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex min-h-[60vh] flex-col items-center justify-center text-center"
        >
          <Search className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Search a brand to generate intelligence</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Enter a brand name or domain in the search bar above to load the dashboard.
          </p>
        </motion.div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      topBar={{
        brandName,
        dateRange: dashboardData.dateRange,
        onSearch: search,
        searchLoading: loading,
        analyzingBrand,
      }}
    >
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 grid grid-cols-12 gap-4 bg-background/95 p-6 lg:gap-6"
          >
            <div className="col-span-12 md:col-span-6 lg:col-span-4"><CardSkeleton lines={4} /></div>
            <div className="col-span-12 md:col-span-6 lg:col-span-4"><CardSkeleton lines={4} /></div>
            <div className="col-span-12 md:col-span-6 lg:col-span-4"><ChartSkeleton height={160} /></div>
            <div className="col-span-12 lg:col-span-6"><ChartSkeleton height={220} /></div>
            <div className="col-span-12 lg:col-span-6"><ChartSkeleton height={220} /></div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center justify-between rounded-xl border border-destructive/50 bg-destructive/10 p-4"
        >
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={retry}>
            <RotateCcw className="h-4 w-4" />
            Retry
          </Button>
        </motion.div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        <motion.div
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }}
          initial="hidden"
          animate="show"
          className="grid min-w-0 flex-1 grid-cols-12 gap-4 lg:gap-6"
        >
          <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="col-span-12 md:col-span-6 lg:col-span-4">
            <BrandDNACard data={dashboardData.brandDNA} />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="col-span-12 md:col-span-6 lg:col-span-4">
            <StrengthScoreCard data={dashboardData.strengthScore} />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="col-span-12 md:col-span-6 lg:col-span-4">
            <GrowthChart data={memoizedGrowthChart} yoYPercent={dashboardData.growthYoY} />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="col-span-12 lg:col-span-6">
            <ChannelMixChart data={memoizedChannelMix} />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="col-span-12 lg:col-span-6">
            <DemandVsBrandChart data={memoizedDemandVsBrand} />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="col-span-12 lg:col-span-6">
            <KeywordClusters
              clusters={dashboardData.keywordClusters}
              onClusterClick={(c) => {
                setSelectedCluster(c);
                setKeywordDrawerOpen(true);
              }}
            />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="col-span-12 lg:col-span-6">
            <ContentOpportunityCard data={dashboardData.contentOpportunity} />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="col-span-12 lg:col-span-6">
            <CampaignThemes
              themes={dashboardData.campaignThemes}
              onThemeClick={(t) => {
                setSelectedCampaign(t);
                setCampaignModalOpen(true);
              }}
            />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="col-span-12 lg:col-span-6">
            <MessagingStrategyCard summary={dashboardData.messagingStrategy} />
          </motion.div>
        </motion.div>

        <div className="w-full shrink-0 lg:w-80">
          <StrategyPanel
            data={dashboardData.strategyPanel}
            onGenerateVideo={handleGenerateVideo}
            videoState={videoState}
            videoSteps={videoSteps.length ? videoSteps : undefined}
            videoScript={videoScript}
            audioUrl={audioUrl}
            videoError={videoError}
            onGenerateCampaign={handleGenerateCampaign}
            campaignLoading={campaignLoading}
            campaignStep={campaignStep}
            campaignOutput={campaignOutput}
            campaignError={campaignError}
            onClearCampaignOutput={() => { setCampaignOutput(null); setCampaignError(null); }}
            brandName={brandName}
          />
        </div>
      </div>

      <KeywordDrawer
        cluster={selectedCluster}
        open={keywordDrawerOpen}
        onClose={() => setKeywordDrawerOpen(false)}
      />
      <CampaignDetailModal
        campaign={selectedCampaign}
        open={campaignModalOpen}
        onClose={() => setCampaignModalOpen(false)}
      />
    </DashboardShell>
  );
}

export default function DashboardPage() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
