"use client";

import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { SearchBar } from "@/components/dashboard/search-bar";
import { CampaignCard as LegacyCampaignCard } from "@/components/cards/campaign-card";
import { CampaignDetail } from "@/components/dashboard/campaign-detail";
import { CampaignTimelineSection } from "@/components/dashboard/campaign-timeline-section";
import { YouTubeCreativesCard } from "@/components/cards/youtube-creatives-card";
import { InsightCard } from "@/components/cards/insight-card";
import { MaturityCard } from "@/components/dashboard/maturity-card";
import { ChannelMixDonut } from "@/components/dashboard/channel-mix-donut";
import { GradientAreaTrafficChart } from "@/components/charts/GradientAreaTrafficChart";
import { ChannelMixDonut as ChartsChannelMixDonut } from "@/components/charts/ChannelMixDonut";
import { StackedChannelBar } from "@/components/charts/StackedChannelBar";
import { RadialScore } from "@/components/charts/RadialScore";
import { KPIStatCard } from "@/components/dashboard/KPIStatCard";
import { CampaignCard as DashboardCampaignCard } from "@/components/dashboard/CampaignCard";
import { AssetPerformanceCard } from "@/components/dashboard/AssetPerformanceCard";
import { CompetitorBarList } from "@/components/dashboard/CompetitorBarList";
import { InsightPill } from "@/components/dashboard/InsightPill";
import { GeoOpportunityCard } from "@/components/dashboard/geo-opportunity-card";
import { StrategicRecommendationCard } from "@/components/dashboard/strategic-recommendation-card";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import type { AnalyzeBrandResponse, Campaign } from "@/types";
import type { CampaignOutput, CampaignJobProgress, AssetVersion } from "@/types/campaign";
import { mapAnalyzeToCampaignInput } from "@/lib/mapAnalyzeToCampaignInput";
import { AssetStudioDrawer, type AssetJobStatus } from "@/components/assets/AssetStudioDrawer";
import {
  buildAssetPrompt,
  hasDirectPrompt,
  type AssetPromptFormState,
} from "@/components/assets/AssetPromptFormState";
import { AssetVersionStack } from "@/components/assets/AssetVersionStack";
import { AppShell, type AppSection } from "@/components/layout/AppShell";
import { ImageIcon } from "lucide-react";
import { usePolling } from "@/hooks/usePolling";

const POLL_INTERVAL_MS = 1000;

type CampaignStatusJson = {
  status?: string;
  output?: CampaignOutput;
  error?: string;
  progress?: CampaignJobProgress;
};

const AD_TYPE_LABELS: Record<string, string> = {
  social_post: "Social post",
  banner: "Banner",
  product_focus: "Product focus",
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

export default function Home() {
  const [result, setResult] = useState<AnalyzeBrandResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const [posterLoading, setPosterLoading] = useState(false);
  const [posterOutput, setPosterOutput] = useState<CampaignOutput | null>(null);
  const [posterError, setPosterError] = useState<string | null>(null);
  const [posterProgress, setPosterProgress] = useState<CampaignJobProgress | null>(null);

  const [videoLoading, setVideoLoading] = useState(false);
  const [videoOutput, setVideoOutput] = useState<CampaignOutput | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState<CampaignJobProgress | null>(null);

  /** Precomputed brain ID from analyze-brand (enables fast video on first click). */
  const [analyzeCampaignBrainId, setAnalyzeCampaignBrainId] = useState<string | null>(null);
  /** Job ID of last completed run that has campaignBrain (enables video-fast). */
  const [campaignBrainJobId, setCampaignBrainJobId] = useState<string | null>(null);

  const [activeJobMode, setActiveJobMode] = useState<"image" | "video" | "video-fast" | "both" | null>(null);
  const currentJobIdRef = useRef<string | null>(null);
  const activeJobModeRef = useRef<"image" | "video" | "video-fast" | "both" | null>(null);
  /** Set when we've applied completed output for current job; used to stop polling after ERR_HTTP2_PROTOCOL_ERROR etc. */
  const campaignJobCompletedRef = useRef(false);
  /** Job ID the page is currently polling; cards with this jobId skip their own polling. */
  const [currentPollingJobId, setCurrentPollingJobId] = useState<string | null>(null);

  const pollStartedAtRef = useRef<number>(0);
  const pollMaxMsRef = useRef<number>(0);
  const consecutiveFailuresRef = useRef<number>(0);
  const campaignPollingSetLoadingRef = useRef<(v: boolean) => void>(() => {});
  const campaignPollingSetJobErrorRef = useRef<(v: string | null) => void>(() => {});
  const campaignPollingSetProgressRef = useRef<(v: CampaignJobProgress | null) => void>(() => {});
  const campaignPollingOnSuccessRef = useRef<(data: CampaignStatusJson) => void>(() => {});
  const campaignPollingOnErrorRef = useRef<(err: unknown) => void>(() => {});

  const [assetStudioOpen, setAssetStudioOpen] = useState(false);
  const [assetStudioDefaultMode, setAssetStudioDefaultMode] = useState<"image" | "video">("image");
  const [activeSection, setActiveSection] = useState<AppSection>("overview");
  const [assetHistory, setAssetHistory] = useState<Record<string, AssetVersion[]>>({});

  const assetCount = Object.values(assetHistory).flat().filter((v) => v.status === "completed").length;

  const imageStatus: AssetJobStatus = posterLoading
    ? "generating"
    : posterError
      ? "failed"
      : posterOutput
        ? "completed"
        : "idle";
  const videoStatus: AssetJobStatus = videoLoading
    ? "generating"
    : videoError
      ? "failed"
      : videoOutput
        ? "completed"
        : "idle";

  // Server alignment: when app is on localhost, always use same-origin /api/* so the worker runs in this process (Grok logs in same terminal).
  const campaignApiBase = (() => {
    if (typeof window === "undefined") return null;
    const origin = window.location?.origin ?? "";
    const onLocalhost = /^https?:\/\/localhost(:\d+)?$/i.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/i.test(origin);
    if (onLocalhost) return null;
    return typeof process.env.NEXT_PUBLIC_CAMPAIGN_API_URL === "string"
      ? process.env.NEXT_PUBLIC_CAMPAIGN_API_URL.replace(/\/$/, "")
      : null;
  })();

  const handleSearch = useCallback(async (brandInput: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedCampaign(null);
    setPosterOutput(null);
    setPosterError(null);
    setPosterProgress(null);
    setVideoOutput(null);
    setVideoError(null);
    setVideoProgress(null);
    setAnalyzeCampaignBrainId(null);
    setCampaignBrainJobId(null);
    try {
      const res = await fetch("/api/analyze-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: brandInput }),
      });
      let data: { jobId?: string; status?: string; error?: string; result?: AnalyzeBrandResponse } & Record<string, unknown>;
      try {
        data = await res.json();
      } catch {
        setError(
          res.status === 504
            ? "Request timed out. The analysis takes a while—try again or use a shorter brand name."
            : "Analysis failed (invalid response). Try again."
        );
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Analysis failed");
        return;
      }
      const jobId = data.jobId;
      const status = data.status;
      if (status === "pending" && jobId) {
        for (let i = 0; i < 120; i++) {
          const pollRes = await fetch(`/api/analyze-brand/${jobId}`, { cache: "no-store" });
          const pollData = (await pollRes.json().catch(() => ({}))) as {
            status?: string;
            result?: AnalyzeBrandResponse;
            error?: string;
          };
          if (!pollRes.ok) {
            setError((pollData as { error?: string }).error ?? `Request failed (${pollRes.status})`);
            return;
          }
          if (pollData.status === "completed") {
            if (pollData.result && typeof pollData.result === "object") {
              const resultData = pollData.result;
              setResult(resultData);
              if (resultData.campaignBrainId) setAnalyzeCampaignBrainId(resultData.campaignBrainId);
              if (resultData.campaigns?.length > 0) {
                setSelectedCampaign(resultData.campaigns[0]);
              }
              return;
            }
            setError("Analysis completed but no data was returned. Try again.");
            return;
          }
          if (pollData.status === "failed") {
            setError(pollData.error ?? "Analysis failed");
            return;
          }
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        }
        setError("Analysis is taking longer than expected. Try again.");
        return;
      }
      if (data && typeof data === "object" && Array.isArray((data as unknown as AnalyzeBrandResponse).campaigns)) {
        const resultData = data as unknown as AnalyzeBrandResponse;
        setResult(resultData);
        if (resultData.campaignBrainId) setAnalyzeCampaignBrainId(resultData.campaignBrainId);
        if (resultData.campaigns?.length > 0) setSelectedCampaign(resultData.campaigns[0]);
      } else {
        setError("Invalid response. Try again.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAssetVersion = useCallback(
    (cid: string, jobId: string, update: Partial<AssetVersion>) => {
      setAssetHistory((prev) => ({
        ...prev,
        [cid]: (prev[cid] ?? []).map((v) => (v.jobId === jobId ? { ...v, ...update } : v)),
      }));
    },
    []
  );

  const pollCampaignStatus = useCallback(async (): Promise<CampaignStatusJson> => {
    const id = currentJobIdRef.current;
    if (!id) return { status: "failed", error: "No job" };
    const statusUrl = campaignApiBase
      ? `${campaignApiBase}/campaign-status?jobId=${encodeURIComponent(id)}`
      : `/api/campaign-status?jobId=${encodeURIComponent(id)}`;
    const res = await fetch(statusUrl, { cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as CampaignStatusJson;
    if (res.status === 404) return { ...json, status: "failed", error: "Job not found or expired" };
    if (!res.ok) return { ...json, status: "failed", error: (json as { error?: string }).error ?? "Failed to get status" };
    return json;
  }, [campaignApiBase]);

  const { start: campaignPollingStart, stop: campaignPollingStop } = usePolling<CampaignStatusJson>({
    pollFn: pollCampaignStatus,
    interval: POLL_INTERVAL_MS,
    enabled: true,
    stopWhen: (data) =>
      (data.status ?? "").toLowerCase() === "completed" || (data.status ?? "").toLowerCase() === "failed",
    onSuccess: (data) => campaignPollingOnSuccessRef.current(data),
    onError: (err) => campaignPollingOnErrorRef.current?.(err),
  });

  const runCampaignJob = useCallback(
    async (mode: "image" | "video", directInput?: { brandName: string; directPrompt: string }) => {
      const input = directInput ?? (result ? mapAnalyzeToCampaignInput(result) : null);
      if (!input?.brandName && !directInput?.directPrompt) {
        if (mode === "image") setPosterError("Run brand analysis first or fill in Goal/Offer in Asset Studio.");
        else setVideoError("Run brand analysis first or fill in Goal/Offer in Asset Studio.");
        return;
      }
      const campaignId = directInput ? "direct" : (selectedCampaign?.campaign_name ?? "default");
      const setLoadingState = mode === "image" ? setPosterLoading : setVideoLoading;
      const setOutput = mode === "image" ? setPosterOutput : setVideoOutput;
      const setJobError = mode === "image" ? setPosterError : setVideoError;
      const setProgress = mode === "image" ? setPosterProgress : setVideoProgress;
      setLoadingState(true);
      setJobError(null);
      setOutput(null);
      setProgress(null);
      setVideoOutput(null);
      setPosterOutput(null);
      setPosterError(null);
      setVideoError(null);
      setPosterProgress(null);
      setVideoProgress(null);
      campaignJobCompletedRef.current = false;
      const campaignBrainId = directInput ? null : (analyzeCampaignBrainId ?? campaignBrainJobId);
      const useFastVideo = !directInput && mode === "video" && campaignBrainId != null;
      const requestBody = useFastVideo
        ? { input: { ...input, campaignBrainId }, mode: "video-fast" as const }
        : { input, mode };
      try {
        const url = campaignApiBase
          ? `${campaignApiBase}/generate-campaign`
          : "/api/generate-campaign";
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        const postJson = (await res.json().catch(() => ({}))) as { jobId?: string; error?: string };
        if (!res.ok) {
          setJobError(postJson.error ?? "Failed to start generation");
          setLoadingState(false);
          return;
        }
        const jobId = postJson.jobId;
        if (!jobId) {
          setJobError("No job ID returned");
          setLoadingState(false);
          return;
        }
        setAssetHistory((prev) => {
          const list = prev[campaignId] ?? [];
          const previousVersions = list.filter((v) => v.mode === mode);
          const newAsset: AssetVersion = {
            jobId,
            version: previousVersions.length + 1,
            mode,
            status: "queued",
            createdAt: Date.now(),
          };
          return { ...prev, [campaignId]: [...list, newAsset] };
        });

        const effectiveMode = useFastVideo ? "video-fast" : mode;
        currentJobIdRef.current = jobId;
        activeJobModeRef.current = effectiveMode;
        setActiveJobMode(effectiveMode);
        setCurrentPollingJobId(jobId);
        console.log("[campaign-ui] START JOB", effectiveMode, jobId);

        pollStartedAtRef.current = Date.now();
        pollMaxMsRef.current = effectiveMode === "image" ? 15 * 60 * 1000 : 50 * 60 * 1000;
        consecutiveFailuresRef.current = 0;
        campaignPollingSetLoadingRef.current = setLoadingState;
        campaignPollingSetJobErrorRef.current = setJobError;
        campaignPollingSetProgressRef.current = setProgress;

        campaignPollingOnSuccessRef.current = (data: CampaignStatusJson) => {
          consecutiveFailuresRef.current = 0;
          const pollJobId = currentJobIdRef.current;
          const setLoading = campaignPollingSetLoadingRef.current;
          const setJobErrorFn = campaignPollingSetJobErrorRef.current;
          const setProgressFn = campaignPollingSetProgressRef.current;
          if (pollJobId == null) return;
          if (Date.now() - pollStartedAtRef.current > pollMaxMsRef.current) {
            const msg = "Generation is taking longer than usual. Please try again or check the server.";
            setJobErrorFn(msg);
            setLoading(false);
            updateAssetVersion(campaignId, pollJobId, { status: "failed", error: msg });
            setCurrentPollingJobId(null);
            campaignPollingStop();
            return;
          }
          console.log("[campaign-ui] POLLING", pollJobId, data);
          if (data.progress != null) setProgressFn(data.progress);
          const status = (data.status ?? "").toLowerCase();
          if (status === "completed" && data.output) {
            if (pollJobId !== currentJobIdRef.current) {
              setLoading(false);
              setCurrentPollingJobId(null);
              campaignPollingStop();
              return;
            }
            const out = data.output;
            if (out.campaignBrain) setCampaignBrainJobId(pollJobId);
            const outputWithResolvedUrls =
              campaignApiBase && (out.adImages?.length ?? 0) > 0
                ? {
                    ...out,
                    adImages: out.adImages.map((img) => {
                      if (img.url == null) return img;
                      const resolved =
                        img.url.startsWith("http") || img.url.startsWith("data:")
                          ? img.url
                          : `${campaignApiBase}${img.url.startsWith("/") ? "" : "/"}${img.url}`;
                      return { ...img, url: resolved };
                    }),
                  }
                : out;
            const jobMode = activeJobModeRef.current;
            if (jobMode === "video" || jobMode === "video-fast") {
              setVideoOutput(outputWithResolvedUrls);
            } else if (jobMode === "image") {
              setPosterOutput(outputWithResolvedUrls);
            } else if (jobMode === "both") {
              if (outputWithResolvedUrls.videoUrl) setVideoOutput(outputWithResolvedUrls);
              if (outputWithResolvedUrls.adImages?.length) setPosterOutput(outputWithResolvedUrls);
            } else {
              setOutput(outputWithResolvedUrls);
            }
            updateAssetVersion(campaignId, pollJobId, { status: "completed", output: outputWithResolvedUrls });
            campaignJobCompletedRef.current = true;
            console.log("[campaign-ui] job completed", jobMode, outputWithResolvedUrls);
            setLoading(false);
            setCurrentPollingJobId(null);
            campaignPollingStop();
            return;
          }
          if (status === "failed") {
            if (pollJobId !== currentJobIdRef.current) {
              setLoading(false);
              setCurrentPollingJobId(null);
              campaignPollingStop();
              return;
            }
            const err =
              (activeJobModeRef.current === "image" && (data.output as CampaignOutput | undefined)?.posterError) ||
              data.error ||
              "Generation failed";
            setJobErrorFn(err);
            updateAssetVersion(campaignId, pollJobId, { status: "failed", error: err });
            setLoading(false);
            setCurrentPollingJobId(null);
            campaignPollingStop();
          }
        };

        campaignPollingOnErrorRef.current = (err: unknown) => {
          if (campaignJobCompletedRef.current) {
            campaignPollingStop();
            return;
          }
          consecutiveFailuresRef.current += 1;
          const message = err instanceof Error ? err.message : "Network error";
          const setLoading = campaignPollingSetLoadingRef.current;
          const setJobErrorFn = campaignPollingSetJobErrorRef.current;
          if (
            consecutiveFailuresRef.current >= 3 ||
            message.includes("ERR_CONNECTION_REFUSED") ||
            message.includes("Failed to fetch") ||
            message.includes("ERR_HTTP2_PROTOCOL_ERROR")
          ) {
            setJobErrorFn(
              "Lost connection to the server while polling. Restart the dev server and generate a new video."
            );
            setLoading(false);
            setCurrentPollingJobId(null);
            campaignPollingStop();
          }
        };

        campaignPollingStop();
        campaignPollingStart();
      } catch (e) {
        setJobError(e instanceof Error ? e.message : "Request failed");
        setLoadingState(false);
      }
    },
    [
      result,
      campaignApiBase,
      analyzeCampaignBrainId,
      campaignBrainJobId,
      selectedCampaign,
      updateAssetVersion,
      campaignPollingStart,
      campaignPollingStop,
    ]
  );

  const handleAssetStudioGenerate = useCallback(
    (mode: "image" | "video", formState?: AssetPromptFormState) => {
      if (result) {
        runCampaignJob(mode);
        return;
      }
      if (formState && hasDirectPrompt(formState)) {
        const brandName = formState.brandName?.trim() || formState.goal?.trim() || formState.offer?.trim() || "Asset Studio";
        runCampaignJob(mode, {
          brandName,
          directPrompt: buildAssetPrompt(formState, mode),
        });
        return;
      }
      const setJobError = mode === "image" ? setPosterError : setVideoError;
      setJobError("Run brand analysis first or fill in Goal, Audience, or Offer in Asset Studio.");
    },
    [result, runCampaignJob]
  );

  const handleGeneratePosters = useCallback(() => {
    setAssetStudioDefaultMode("image");
    setAssetStudioOpen(true);
  }, []);
  const handleGenerateVideo = useCallback(() => {
    setAssetStudioDefaultMode("video");
    setAssetStudioOpen(true);
  }, []);

  const campaignIdForAssets =
    selectedCampaign?.campaign_name ??
    (Object.keys(assetHistory).includes("direct") ? "direct" : "default");

  const synthetic = result?.synthetic_data;
  const trafficTrend = result?.traffic_trend ?? synthetic?.traffic_trend ?? [];
  const channelMix = synthetic?.channel_mix;
  const maturity = result?.insights?.marketing_maturity_level;

  return (
    <>
      <AppShell
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onSearch={handleSearch}
        isSearchLoading={loading}
        searchError={error}
        onGenerateAsset={() => setAssetStudioOpen(true)}
      >
        {loading && <DashboardSkeleton />}

        {!loading && result && activeSection === "overview" && (() => {
          const cm = channelMix ?? { organic: 0, paid: 0, social: 0, direct: 0 };
          const totalCh = cm.organic + cm.paid + cm.social + cm.direct;
          const organicPct = totalCh > 0 ? Math.round((cm.organic / totalCh) * 100) : 0;
          const paidPct = totalCh > 0 ? Math.round((cm.paid / totalCh) * 100) : 0;
          const brandScore = result.insights?.growth_score ?? synthetic?.domain_overview?.authority_score ?? 0;
          const avgSuccess = result.campaigns?.length ? Math.round(result.campaigns.reduce((s, c) => s + (c.success_score ?? 0), 0) / result.campaigns.length) : 0;
          const marketScore = result.insights?.market_position === "leader" ? 8 : result.insights?.market_position === "challenger" ? 5 : result.insights?.market_position === "niche" ? 3 : (result.insights?.growth_score ?? 0);
          const formatMonth = (p: { month?: string; date?: string }) => {
            if (p.month && p.month.length >= 2) return p.month.slice(0, 3);
            const d = p.date ? new Date(p.date.toString()) : null;
            if (d && !Number.isNaN(d.getTime())) return d.toLocaleString("en-US", { month: "short" });
            return (p.date ?? "").toString().slice(0, 3);
          };
          const trafficChartData = trafficTrend.length > 0
            ? trafficTrend.map((p) => ({
                month: formatMonth(p),
                organic: p.organic ?? 0,
                paid: p.paid ?? 0,
                total: p.traffic ?? p.value ?? p.total ?? 0,
              }))
            : [];
          const competitorList = (synthetic?.competitors ?? []).map((c) => ({ domain: c.domain, score: c.overlap ?? c.overlap_score ?? 0 }));
          const strategyPills = (result.insights?.content_strategy_focus ?? "").split(/[,;]/).map((s) => s.trim()).filter(Boolean);
          return (
          <motion.div variants={container} initial="hidden" animate="show" className="w-full space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
              <KPIStatCard title="Brand score" value={brandScore} delta={0} progress={brandScore * 10} />
              <KPIStatCard title="Organic traffic %" value={`${organicPct}%`} delta={0} progress={organicPct} />
              <KPIStatCard title="Paid traffic %" value={`${paidPct}%`} delta={0} progress={paidPct} />
              <KPIStatCard title="Avg campaign success" value={avgSuccess} delta={0} progress={avgSuccess * 10} />
              <KPIStatCard title="Asset performance" value={assetCount} delta={0} progress={assetCount > 0 ? Math.min(100, assetCount * 20) : 0} />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <GradientAreaTrafficChart data={trafficChartData} />
              </div>
              <ChartsChannelMixDonut organic={cm.organic} paid={cm.paid} social={cm.social} direct={cm.direct} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 shadow-lg shadow-black/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                <StackedChannelBar organicPct={organicPct} paidPct={paidPct} otherPct={100 - organicPct - paidPct} />
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 shadow-lg shadow-black/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 flex flex-col items-center justify-center">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Market position</h3>
                <RadialScore value={marketScore} max={10} size={64} />
              </div>
              <CompetitorBarList competitors={competitorList} />
              <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 shadow-lg shadow-black/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Content strategy</h3>
                <div className="flex flex-wrap gap-2">
                  {strategyPills.length > 0 ? strategyPills.map((t) => <InsightPill key={t} text={t} />) : <p className="text-sm text-slate-400">No content strategy data</p>}
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-xs uppercase tracking-widest text-slate-400 mb-4">Asset performance</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {videoOutput?.videoUrl && (
                  <AssetPerformanceCard type="video" src={videoOutput.videoUrl} label="Latest video" onRegenerate={handleGenerateVideo} isRegenerating={videoLoading} />
                )}
                {(posterOutput?.adImages?.length ?? 0) > 0 &&
                  posterOutput!.adImages!.filter((img): img is typeof img & { url: string } => Boolean(img.url)).slice(0, 2).map((img) => (
                    <AssetPerformanceCard key={img.type} type="image" src={img.url} label={AD_TYPE_LABELS[img.type] ?? img.type} onRegenerate={handleGeneratePosters} isRegenerating={posterLoading} />
                  ))}
                {!videoOutput?.videoUrl && !(posterOutput?.adImages?.length) && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4">
                      <ImageIcon className="w-7 h-7 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-300 mb-4">No assets generated yet</p>
                    <button type="button" onClick={() => setAssetStudioOpen(true)} className="btn-gradient px-5 py-2.5 rounded-xl font-medium text-white shadow-lg hover:shadow-xl transition-all">Generate Asset</button>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h2 className="text-xs uppercase tracking-widest text-slate-400 mb-4">Campaigns</h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {(result.campaigns ?? []).map((c, i) => (
                  <DashboardCampaignCard key={c.campaign_name + i} campaign={c} isSelected={selectedCampaign?.campaign_name === c.campaign_name} onClick={() => setSelectedCampaign(c)} index={i} />
                ))}
              </div>
            </div>
          </motion.div>
          );
        })()}

        {!loading && result && activeSection === "asset-studio" && (
          <div className="card-analytics p-8 max-w-md">
            <h2 className="text-lg font-semibold text-white mb-2">Asset Studio</h2>
            <p className="text-sm text-slate-400 mb-4">Generate campaign posters or video from your campaign brief.</p>
            <button type="button" onClick={() => setAssetStudioOpen(true)} className="btn-gradient px-4 py-2 rounded-xl font-medium text-white">Open Asset Studio</button>
          </div>
        )}

        {!loading && result && activeSection === "campaigns" && (
          <motion.div variants={container} initial="hidden" animate="show" className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Campaigns</h2>
                <div className="space-y-3">
                  {(result.campaigns ?? []).map((campaign, i) => (
                    <LegacyCampaignCard
                      key={campaign.campaign_name + i}
                      campaign={campaign}
                      isSelected={selectedCampaign?.campaign_name === campaign.campaign_name}
                      onClick={() => setSelectedCampaign(campaign)}
                      index={i}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Campaign detail</h2>
                <CampaignDetail campaign={selectedCampaign} brandName={result.brand_overview.name} />
                {result.campaign_timeline != null && result.campaign_timeline.length > 0 && (
                  <CampaignTimelineSection events={result.campaign_timeline} />
                )}
                {result.youtube_creatives != null && result.youtube_creatives.length > 0 && (
                  <YouTubeCreativesCard creatives={result.youtube_creatives} />
                )}
              </div>
            </div>
          </motion.div>
        )}

        {!loading && activeSection === "assets-library" && (result || Object.keys(assetHistory).includes("direct")) && (
          <motion.div variants={container} initial="hidden" animate="show" className="w-full space-y-10">
            <section>
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Generated images</h2>
              {(assetHistory[campaignIdForAssets] ?? []).filter((v) => v.mode === "image").length > 0 ? (
                <AssetVersionStack
                  versions={(assetHistory[campaignIdForAssets] ?? []).filter((v) => v.mode === "image")}
                  mode="image"
                  label="Campaign posters"
                  campaignApiBase={campaignApiBase}
                  currentJobId={currentPollingJobId}
                  onRegenerate={() => runCampaignJob("image")}
                  isRegenerating={posterLoading}
                  onUpdateVersion={(jobId, update) => updateAssetVersion(campaignIdForAssets, jobId, update)}
                  imageTypeLabels={AD_TYPE_LABELS}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-muted-foreground card-premium">
                  <p className="text-sm">No images yet for this campaign. Generate from Overview or open Asset Studio.</p>
                  <button type="button" onClick={() => { setAssetStudioDefaultMode("image"); setAssetStudioOpen(true); }} className="mt-3 text-sm font-medium text-primary hover:underline">Open Asset Studio</button>
                </div>
              )}
            </section>
            <section>
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Generated videos</h2>
              {(assetHistory[campaignIdForAssets] ?? []).filter((v) => v.mode === "video").length > 0 ? (
                <AssetVersionStack
                  versions={(assetHistory[campaignIdForAssets] ?? []).filter((v) => v.mode === "video")}
                  mode="video"
                  label="Campaign video"
                  campaignApiBase={campaignApiBase}
                  currentJobId={currentPollingJobId}
                  onRegenerate={() => runCampaignJob("video")}
                  isRegenerating={videoLoading}
                  onUpdateVersion={(jobId, update) => updateAssetVersion(campaignIdForAssets, jobId, update)}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-muted-foreground card-premium">
                  <p className="text-sm">No video yet for this campaign. Generate from Overview or open Asset Studio.</p>
                  <button type="button" onClick={() => { setAssetStudioDefaultMode("video"); setAssetStudioOpen(true); }} className="mt-3 text-sm font-medium text-primary hover:underline">Open Asset Studio</button>
                </div>
              )}
            </section>
          </motion.div>
        )}

        {!loading && result && activeSection === "insights" && (
          <motion.div variants={container} initial="hidden" animate="show" className="w-full max-w-2xl space-y-6">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Insights</h2>
            {maturity != null && <MaturityCard level={maturity} />}
            {channelMix != null && (
              <div className="card-analytics p-5">
                <h3 className="text-sm font-medium text-white mb-3">Channel mix</h3>
                <ChannelMixDonut channelMix={channelMix} />
              </div>
            )}
            <GeoOpportunityCard insights={result.insights} />
            <StrategicRecommendationCard insights={result.insights} />
            <InsightCard insights={result.insights} index={0} />
          </motion.div>
        )}

        {!loading && !result && !error && (
          (videoOutput?.videoUrl || (posterOutput?.adImages?.length ?? 0) > 0) ? (
            <motion.div variants={container} initial="hidden" animate="show" className="w-full space-y-8">
              <div>
                <h2 className="text-xs uppercase tracking-widest text-slate-400 mb-4">Generated from Asset Studio</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videoOutput?.videoUrl && (
                    <AssetPerformanceCard type="video" src={videoOutput.videoUrl} label="Latest video" onRegenerate={handleGenerateVideo} isRegenerating={videoLoading} />
                  )}
                  {(posterOutput?.adImages?.length ?? 0) > 0 &&
                    posterOutput!.adImages!.filter((img): img is typeof img & { url: string } => Boolean(img.url)).slice(0, 2).map((img) => (
                      <AssetPerformanceCard key={img.type} type="image" src={img.url} label={AD_TYPE_LABELS[img.type] ?? img.type} onRegenerate={handleGeneratePosters} isRegenerating={posterLoading} />
                    ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto px-4">
              <p className="text-base font-medium text-slate-800 dark:text-slate-200">
                Enter a brand name or domain to run campaign intelligence.
              </p>
              <p className="text-sm mt-2 text-slate-600 dark:text-slate-400">e.g. Nike, nike.com, Stripe</p>
            </div>
          )
        )}
      </AppShell>

      <AssetStudioDrawer
        open={assetStudioOpen}
        onClose={() => setAssetStudioOpen(false)}
        campaign={selectedCampaign}
        defaultMode={assetStudioDefaultMode}
        onGenerate={handleAssetStudioGenerate}
        imageStatus={imageStatus}
        videoStatus={videoStatus}
        posterProgress={posterProgress}
        videoProgress={videoProgress}
        posterError={posterError}
        videoError={videoError}
      />
    </>
  );
}
