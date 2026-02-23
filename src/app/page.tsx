"use client";

import { useState, useCallback } from "react";
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
import Link from "next/link";
import { Loader2, Download, LayoutGrid, ImageIcon, FolderOpen } from "lucide-react";
import { Player } from "@remotion/player";
import {
  StrategyVideo,
  getStrategyVideoDuration,
} from "../../remotion/StrategyVideo";
import type { AnalyzeBrandResponse, Campaign } from "@/types";
import type { VideoScript } from "@/types/video";

const REMOTION_FPS = 30;
const REMOTION_WIDTH = 1920;
const REMOTION_HEIGHT = 1080;

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
  const [videoScript, setVideoScript] = useState<VideoScript | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [renderLoading, setRenderLoading] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);

  const handleSearch = useCallback(async (brandInput: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedCampaign(null);
    setVideoScript(null);
    setAudioUrl(null);
    setVideoError(null);
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
      if (data.campaigns?.length > 0) {
        setSelectedCampaign(data.campaigns[0]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGenerateVideo = useCallback(async () => {
    if (!result) return;
    setVideoLoading(true);
    setVideoError(null);
    setRenderError(null);
    setExportedVideoUrl(null);
    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardData: result }),
      });
      let data: { title?: string; scenes?: unknown[]; audioUrl?: string; audioBase64?: string; error?: string };
      try {
        data = await res.json();
      } catch {
        setVideoError(
          res.status === 504
            ? "Request timed out. Video generation can take a minute—try again."
            : "Video generation failed (invalid response)."
        );
        setVideoLoading(false);
        return;
      }
      if (!res.ok) {
        setVideoError(
          res.status === 504
            ? "Request timed out. Video generation can take a minute—try again."
            : data.error ?? "Video generation failed"
        );
        setVideoLoading(false);
        return;
      }
      if (data.title && Array.isArray(data.scenes)) {
        setVideoScript({ title: data.title, scenes: data.scenes });
        if (data.audioUrl) {
          setAudioUrl(data.audioUrl);
        } else if (data.audioBase64) {
          const bytes = Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0));
          const blob = new Blob([bytes], { type: "audio/mpeg" });
          setAudioUrl(URL.createObjectURL(blob));
        }
      }
    } catch (e) {
      setVideoError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setVideoLoading(false);
    }
  }, [result]);

  const handleDownloadVideo = useCallback(async () => {
    if (!videoScript || !audioUrl) return;
    setRenderLoading(true);
    setRenderError(null);
    setExportedVideoUrl(null);
    try {
      const brandName = result?.brand_overview?.name ?? undefined;
      const res = await fetch("/api/render-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: videoScript.title,
          scenes: videoScript.scenes,
          audioUrl,
          brandName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRenderError(data.error ?? "Render failed");
        setRenderLoading(false);
        return;
      }
      if (data.videoUrl) {
        setExportedVideoUrl(data.videoUrl);
        window.open(data.videoUrl, "_blank");
      }
    } catch (e) {
      setRenderError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setRenderLoading(false);
    }
  }, [videoScript, audioUrl, result]);

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
              <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                <LayoutGrid className="h-4 w-4" /> Dashboard
              </Link>
              <Link href="/campaign-studio" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                <ImageIcon className="h-4 w-4" /> Campaign Studio
              </Link>
              <Link href="/assets" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                <FolderOpen className="h-4 w-4" /> Assets
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

            <motion.div
              variants={container}
              className="mb-6 flex flex-col gap-3"
            >
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerateVideo}
                  disabled={videoLoading}
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  {videoLoading ? "Generating strategy video…" : "Generate Strategy Video"}
                </button>
                {videoError && (
                  <p className="text-sm text-destructive">{videoError}</p>
                )}
              </div>
              {videoLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  <span>Generating script and voiceover…</span>
                </div>
              )}
              {videoScript && audioUrl && !videoLoading && (
                <div className="rounded-xl border border-border bg-card shadow-sm max-w-2xl space-y-4 p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Strategy script & voiceover
                  </h3>
                  <p className="text-sm font-medium">{videoScript.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {videoScript.scenes.length} scenes — preview below, then export MP4
                  </p>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-muted-foreground">Voiceover</span>
                    <audio src={audioUrl} controls className="w-full max-w-md" />
                  </div>
                  <div className="rounded-lg overflow-hidden bg-black/80" style={{ aspectRatio: "16/9", maxHeight: 360 }}>
                    <Player
                      component={StrategyVideo}
                      inputProps={{
                        title: videoScript.title,
                        scenes: videoScript.scenes,
                        audioUrl,
                      }}
                      durationInFrames={getStrategyVideoDuration(videoScript.scenes.length)}
                      compositionWidth={REMOTION_WIDTH}
                      compositionHeight={REMOTION_HEIGHT}
                      fps={REMOTION_FPS}
                      style={{ width: "100%", height: "100%" }}
                      controls
                      loop
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadVideo}
                      disabled={renderLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                    >
                      {renderLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Rendering…
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Download Video
                        </>
                      )}
                    </button>
                    {renderError && (
                      <p className="text-sm text-destructive">{renderError}</p>
                    )}
                    {exportedVideoUrl && (
                      <a
                        href={exportedVideoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Open MP4
                      </a>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

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
