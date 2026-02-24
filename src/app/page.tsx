"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchBar } from "@/components/dashboard/search-bar";
import { BrandHeader } from "@/components/dashboard/brand-header";
import { CampaignCard } from "@/components/cards/campaign-card";
import { CampaignDetail } from "@/components/dashboard/campaign-detail";
import { CampaignTimelineSection } from "@/components/dashboard/campaign-timeline-section";
import { TrafficTrendChart } from "@/components/dashboard/traffic-trend-chart";
import { YouTubeCreativesCard } from "@/components/cards/youtube-creatives-card";
import { InsightCard } from "@/components/cards/insight-card";
import { MaturityCard } from "@/components/dashboard/maturity-card";
import { ChannelMixDonut } from "@/components/dashboard/channel-mix-donut";
import { GeoOpportunityCard } from "@/components/dashboard/geo-opportunity-card";
import { StrategicRecommendationCard } from "@/components/dashboard/strategic-recommendation-card";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Loader2, ImageIcon, Video } from "lucide-react";
import type { AnalyzeBrandResponse, Campaign } from "@/types";
import type { CampaignOutput, CampaignJobProgress } from "@/types/campaign";
import { mapAnalyzeToCampaignInput } from "@/lib/mapAnalyzeToCampaignInput";

const POLL_INTERVAL_MS = 1000;
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

  const campaignApiBase =
    typeof process.env.NEXT_PUBLIC_CAMPAIGN_API_URL === "string"
      ? process.env.NEXT_PUBLIC_CAMPAIGN_API_URL.replace(/\/$/, "")
      : null;

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
      let data: AnalyzeBrandResponse & { error?: string };
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
      setResult(data as AnalyzeBrandResponse);
      if (data.campaignBrainId) setAnalyzeCampaignBrainId(data.campaignBrainId);
      if (data.campaigns?.length > 0) {
        setSelectedCampaign(data.campaigns[0]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const runCampaignJob = useCallback(
    async (mode: "image" | "video") => {
      if (!result) return;
      const input = mapAnalyzeToCampaignInput(result);
      if (!input.brandName) {
        if (mode === "image") setPosterError("Brand name missing");
        else setVideoError("Brand name missing");
        return;
      }
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
      const campaignBrainId = analyzeCampaignBrainId ?? campaignBrainJobId;
      const useFastVideo = mode === "video" && campaignBrainId != null;
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
        const effectiveMode = useFastVideo ? "video-fast" : mode;
        currentJobIdRef.current = jobId;
        activeJobModeRef.current = effectiveMode;
        setActiveJobMode(effectiveMode);
        console.log("[campaign-ui] START JOB", effectiveMode, jobId);

        const startPolling = (pollJobId: string) => {
          const poll = async (): Promise<boolean> => {
            const statusUrl = campaignApiBase
              ? `${campaignApiBase}/campaign-status?jobId=${encodeURIComponent(pollJobId)}`
              : `/api/campaign-status?jobId=${encodeURIComponent(pollJobId)}`;
            try {
              const statusRes = await fetch(statusUrl, { cache: "no-store" });
              const statusJson = (await statusRes.json().catch(() => ({}))) as {
                status?: string;
                output?: CampaignOutput;
                error?: string;
                progress?: CampaignJobProgress;
              };
              console.log("[campaign-ui] POLLING", pollJobId, statusJson);
              if (pollJobId !== currentJobIdRef.current) {
                setLoadingState(false);
                return true;
              }
              if (statusJson.progress != null) {
              setProgress(statusJson.progress);
            }
            if (statusRes.status === 404) {
              setJobError("Job not found or expired");
              setLoadingState(false);
              return true;
            }
            if (!statusRes.ok) {
              setJobError((statusJson as { error?: string }).error ?? "Failed to get status");
              setLoadingState(false);
              return true;
            }
            const status = statusJson.status;
            if (status === "completed" && statusJson.output) {
              if (pollJobId !== currentJobIdRef.current) {
                setLoadingState(false);
                return true;
              }
              const out = statusJson.output;
              if (out.campaignBrain) setCampaignBrainJobId(pollJobId);
              const outputWithResolvedUrls =
                campaignApiBase && (out.adImages?.length ?? 0) > 0
                  ? {
                      ...out,
                      adImages: out.adImages.map((img) => ({
                        ...img,
                        url:
                          img.url.startsWith("http") || img.url.startsWith("data:")
                            ? img.url
                            : `${campaignApiBase}${img.url.startsWith("/") ? "" : "/"}${img.url}`,
                      })),
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
              console.log("[campaign-ui] job completed", jobMode, outputWithResolvedUrls);
              setLoadingState(false);
              return true;
            }
            if (status === "failed") {
              if (pollJobId !== currentJobIdRef.current) {
                setLoadingState(false);
                return true;
              }
              const err =
                (activeJobModeRef.current === "image" && (statusJson.output as CampaignOutput | undefined)?.posterError) ||
                statusJson.error ||
                "Generation failed";
              setJobError(err);
              setLoadingState(false);
              return true;
            }
            return false;
          } catch {
            return false;
          }
        };
          (async () => {
            let done = await poll();
            if (done) return;
            const intervalId = setInterval(async () => {
              done = await poll();
              if (done) clearInterval(intervalId);
            }, POLL_INTERVAL_MS);
          })();
        };
        startPolling(jobId);
      } catch (e) {
        setJobError(e instanceof Error ? e.message : "Request failed");
        setLoadingState(false);
      }
    },
    [result, campaignApiBase, analyzeCampaignBrainId, campaignBrainJobId]
  );

  const handleGeneratePosters = useCallback(() => runCampaignJob("image"), [runCampaignJob]);
  const handleGenerateVideo = useCallback(() => runCampaignJob("video"), [runCampaignJob]);

  const synthetic = result?.synthetic_data;
  const trafficTrend = result?.traffic_trend ?? synthetic?.traffic_trend ?? [];
  const channelMix = synthetic?.channel_mix;
  const maturity = result?.insights?.marketing_maturity_level;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 sticky top-0 z-10 backdrop-blur rounded-b-xl shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Brand Campaign Intelligence
            </h1>
            <nav className="flex gap-2">
              <Link
                href="/assets"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ImageIcon className="h-4 w-4" /> Assets
              </Link>
            </nav>
          </div>
          <SearchBar onSearch={handleSearch} isLoading={loading} />
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 text-sm text-destructive"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {loading && <DashboardSkeleton />}

        {!loading && result && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="w-full"
          >
            <BrandHeader
              brandOverview={result.brand_overview}
              brandContext={result.brand_context}
            />

            {/* Section 3: Actions */}
            <motion.div variants={container} className="mb-6 flex flex-col gap-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Generate campaign assets
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={handleGeneratePosters}
                    disabled={posterLoading || !result}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    {posterLoading ? (
                      posterProgress != null ? (
                        <span className="tabular-nums">
                          {(posterProgress.overallPercent ?? (posterProgress as { percent?: number }).percent) ?? 0}%
                        </span>
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )
                    ) : (
                      <ImageIcon className="h-4 w-4" />
                    )}
                    {posterLoading
                      ? posterProgress?.image?.step ?? posterProgress?.step ?? "Generating posters… (1–2 min)"
                      : "Generate campaign posters"}
                  </button>
                  {posterLoading && posterProgress != null && (
                    <div className="flex flex-col gap-1 w-full max-w-xs">
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-[width] duration-300"
                          style={{
                            width: `${posterProgress.overallPercent ?? (posterProgress as { percent?: number }).percent ?? 0}%`,
                          }}
                        />
                      </div>
                      {posterProgress.image != null && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Posters: {posterProgress.image.step}</span>
                          <div className="h-1 w-full rounded-full bg-muted/80 overflow-hidden">
                            <div
                              className="h-full bg-primary/80 transition-[width] duration-300"
                              style={{ width: `${posterProgress.image.percent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={handleGenerateVideo}
                    disabled={videoLoading || !result}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    {videoLoading ? (
                      videoProgress != null ? (
                        <span className="tabular-nums">
                          {(videoProgress.overallPercent ?? (videoProgress as { percent?: number }).percent) ?? 0}%
                        </span>
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )
                    ) : (
                      <Video className="h-4 w-4" />
                    )}
                    {videoLoading
                      ? videoProgress?.video?.step ?? videoProgress?.step ?? "Generating video… (may take several min)"
                      : "Generate campaign video"}
                  </button>
                  {videoLoading && videoProgress != null && (
                    <div className="flex flex-col gap-1 w-full max-w-xs">
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-[width] duration-300"
                          style={{
                            width: `${videoProgress.overallPercent ?? (videoProgress as { percent?: number }).percent ?? 0}%`,
                          }}
                        />
                      </div>
                      {videoProgress.video != null && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Video: {videoProgress.video.step}</span>
                          <div className="h-1 w-full rounded-full bg-muted/80 overflow-hidden">
                            <div
                              className="h-full bg-primary/80 transition-[width] duration-300"
                              style={{ width: `${videoProgress.video.percent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {posterError && <p className="text-sm text-destructive">{posterError}</p>}
              {videoError && <p className="text-sm text-destructive">{videoError}</p>}
            </motion.div>

            {/* Section 4: Results */}
            {(posterOutput ?? videoOutput) && (
              <motion.div variants={container} className="mb-8 space-y-6">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Results
                </h2>
                {posterOutput && (
                  <Card className="rounded-2xl border border-border/80 bg-card/80 shadow-sm">
                    <CardHeader className="pb-2">
                      <h3 className="text-sm font-semibold tracking-tight text-foreground">
                        Campaign posters
                      </h3>
                    </CardHeader>
                    <CardContent>
                      {(posterOutput.adImages?.length ?? 0) > 0 ? (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {posterOutput.adImages.map((img) => (
                              <div
                                key={img.type}
                                className="rounded-lg overflow-hidden border border-border/60"
                              >
                                <a href={img.url} target="_blank" rel="noreferrer" className="block">
                                  <img
                                    src={img.url}
                                    alt={AD_TYPE_LABELS[img.type] ?? img.type}
                                    className="w-full h-auto object-cover max-h-48"
                                  />
                                </a>
                                <p className="p-2 text-xs text-muted-foreground">
                                  {AD_TYPE_LABELS[img.type] ?? img.type}
                                </p>
                              </div>
                            ))}
                          </div>
                          {posterOutput.brief?.campaignConcept && (
                            <p className="mt-3 text-sm text-muted-foreground">
                              {posterOutput.brief.campaignConcept}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-destructive">
                          {posterOutput.posterError ?? posterOutput.videoError ?? "Posters could not be generated. Check server logs or try again."}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
                {videoOutput && (videoOutput.videoUrl ?? videoOutput.videoError) && (
                  <Card className="rounded-2xl border border-border/80 bg-card/80 shadow-sm">
                    <CardHeader className="pb-2">
                      <h3 className="text-sm font-semibold tracking-tight text-foreground">
                        Campaign video
                      </h3>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {videoOutput.videoUrl ? (
                        <div className="rounded-lg overflow-hidden bg-black/90 max-w-2xl">
                          <video
                            src={videoOutput.videoUrl}
                            controls
                            className="w-full aspect-video"
                            playsInline
                          >
                            Your browser does not support the video tag.
                          </video>
                          <a
                            href={videoOutput.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block mt-2 text-sm text-primary hover:underline"
                          >
                            Open video in new tab
                          </a>
                        </div>
                      ) : (
                        videoOutput.videoError && (
                          <p className="text-sm text-destructive">{videoOutput.videoError}</p>
                        )
                      )}
                      {videoOutput.brief?.campaignConcept && (
                        <p className="text-sm text-muted-foreground">
                          {videoOutput.brief.campaignConcept}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {trafficTrend.length > 0 && (
              <div className="mb-6">
                <TrafficTrendChart data={trafficTrend} />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
              <motion.div variants={container} className="space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Campaigns
                </h2>
                <div className="space-y-3">
                  {result.campaigns.map((campaign, i) => (
                    <CampaignCard
                      key={campaign.campaign_name + i}
                      campaign={campaign}
                      isSelected={
                        selectedCampaign?.campaign_name === campaign.campaign_name
                      }
                      onClick={() => setSelectedCampaign(campaign)}
                      index={i}
                    />
                  ))}
                </div>
              </motion.div>

              <motion.div variants={container} className="space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Campaign detail
                </h2>
                <CampaignDetail
                  campaign={selectedCampaign}
                  brandName={result.brand_overview.name}
                />
                {result.campaign_timeline != null &&
                  result.campaign_timeline.length > 0 && (
                    <CampaignTimelineSection events={result.campaign_timeline} />
                  )}
                {result.youtube_creatives != null &&
                  result.youtube_creatives.length > 0 && (
                    <YouTubeCreativesCard creatives={result.youtube_creatives} />
                  )}
              </motion.div>

              <motion.div
                variants={container}
                className="space-y-4 lg:sticky lg:top-24 lg:self-start"
              >
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Insights
                </h2>
                {maturity != null && <MaturityCard level={maturity} />}
                {channelMix != null && (
                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Channel mix
                    </h3>
                    <ChannelMixDonut channelMix={channelMix} />
                  </div>
                )}
                <GeoOpportunityCard insights={result.insights} />
                <StrategicRecommendationCard insights={result.insights} />
                <InsightCard insights={result.insights} index={0} />
              </motion.div>
            </div>
          </motion.div>
        )}

        {!loading && !result && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
            <p className="text-sm">
              Enter a brand name or domain to run campaign intelligence.
            </p>
            <p className="text-xs mt-2">e.g. Nike, nike.com, Stripe</p>
          </div>
        )}
      </main>
    </div>
  );
}
