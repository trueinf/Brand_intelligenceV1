"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LAYOUT_PRESET_LABELS,
  type LayoutPresetId,
} from "@/lib/poster-engine/layout-presets";
import type {
  CampaignInfoInput,
  CampaignInfoOutput,
} from "@/lib/campaign-info/campaign-info.types";
import type { CampaignBrief } from "@/types/campaign";
import type { PosterCopy } from "@/types/poster";
import { Download, Loader2, ImageIcon } from "lucide-react";

const PRESET_IDS: LayoutPresetId[] = [
  "instagramPost",
  "instagramStory",
  "webHero",
  "displayAd",
];

export interface PosterPreviewProps {
  /** When provided, poster is composed over this image; when omitted, a default gradient background is used (direct poster). */
  imageUrl?: string | null;
  campaignBrief: CampaignBrief;
  brandLogoUrl?: string | null;
  brandLogoLightUrl?: string | null;
  brandLogoDarkUrl?: string | null;
  /** Brand name for Brand Kit lookup (colors, fonts, logo) */
  brandName?: string | null;
  /** Pre-generated poster URLs (e.g. from parent state); if set, no auto-generate on mount */
  initialPosters?: Record<string, string> | null;
  initialCopy?: PosterCopy | null;
}

export function PosterPreview({
  imageUrl,
  campaignBrief,
  brandLogoUrl,
  brandLogoLightUrl,
  brandLogoDarkUrl,
  brandName,
  initialPosters,
  initialCopy,
}: PosterPreviewProps) {
  const [posters, setPosters] = useState<Record<string, string> | null>(
    initialPosters ?? null
  );
  const [copy, setCopy] = useState<PosterCopy | null>(initialCopy ?? null);
  const [campaignInfo, setCampaignInfo] = useState<CampaignInfoOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<LayoutPresetId>("instagramPost");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");

  const hasPosters = posters && Object.keys(posters).length > 0;
  const activeUrl = hasPosters ? posters[activePreset] : null;

  function buildCampaignInfoInput(): CampaignInfoInput | undefined {
    const brand = (brandName ?? "").trim();
    const valueProp =
      (campaignBrief.valueProposition ?? campaignBrief.keyMessage ?? "").trim();
    if (!brand || !valueProp) return undefined;
    return {
      brandName: brand,
      campaignObjective: "event",
      valueProposition: valueProp,
      targetAudience: campaignBrief.targetAudience ?? "",
      brandTone: campaignBrief.visualStyle ?? "",
      date: eventDate.trim() || undefined,
      time: eventTime.trim() || undefined,
      location: eventLocation.trim() || undefined,
    };
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const campaignInfoInput = buildCampaignInfoInput();
      const hasImage = Boolean(imageUrl?.trim());

      if (hasImage) {
        const res = await fetch("/api/generate-poster", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: imageUrl!.trim(),
            campaignBrief,
            brandLogoUrl: brandLogoUrl ?? undefined,
            brandLogoLightUrl: brandLogoLightUrl ?? undefined,
            brandLogoDarkUrl: brandLogoDarkUrl ?? undefined,
            brandName: brandName ?? undefined,
            campaignInfoInput: campaignInfoInput ?? undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Poster generation failed");
        setPosters(data.posters ?? {});
        setCopy(data.copy ?? null);
        setCampaignInfo(data.campaignInfo ?? null);
        if (data.posters && Object.keys(data.posters).length > 0)
          setActivePreset((Object.keys(data.posters) as LayoutPresetId[])[0]);
      } else {
        const res = await fetch("/api/generate-poster-direct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignBrief,
            brandName: brandName ?? undefined,
            brandLogoUrl: brandLogoUrl ?? undefined,
            brandLogoLightUrl: brandLogoLightUrl ?? undefined,
            brandLogoDarkUrl: brandLogoDarkUrl ?? undefined,
            eventDate: eventDate.trim() || undefined,
            eventTime: eventTime.trim() || undefined,
            eventLocation: eventLocation.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Poster generation failed");
        setPosters(data.posters ?? {});
        setCopy(data.copy ?? null);
        setCampaignInfo(data.campaignInfo ?? null);
        if (data.posters && Object.keys(data.posters).length > 0)
          setActivePreset((Object.keys(data.posters) as LayoutPresetId[])[0]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate posters");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!activeUrl) return;
    const a = document.createElement("a");
    a.href = activeUrl;
    a.download = `campaign-poster-${activePreset}.png`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  if (!hasPosters && !loading) {
    return (
      <Card className="rounded-2xl border border-border/80 bg-card/80 shadow-sm">
        <CardHeader className="pb-2">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Campaign posters
          </h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {imageUrl?.trim()
              ? "Turn this image into one poster with kicker, headline, date line, subline, CTA, and logo—event-style, ready to share."
              : "Create an event-style poster with kicker, headline, date line, subline, CTA, and logo using a template background. Add brand name and event details below."}
          </p>
          {(brandLogoUrl ?? brandLogoLightUrl ?? brandLogoDarkUrl) && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Logo for posters:</span>
              <div className="rounded-lg bg-black/45 p-1.5 inline-flex">
                <img
                  src={brandLogoUrl ?? brandLogoLightUrl ?? brandLogoDarkUrl ?? ""}
                  alt=""
                  className="h-8 w-12 object-contain"
                />
              </div>
            </div>
          )}
          <div className="mb-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Event details (optional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                placeholder="e.g. Saturday, May 18"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="text-sm"
              />
              <Input
                placeholder="e.g. 7:00 PM"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="text-sm"
              />
              <Input
                placeholder="Location (optional)"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                Generate posters
              </>
            )}
          </Button>
          {error && (
            <p className="mt-2 text-sm text-destructive">{error}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-border/80 bg-card/80 shadow-sm">
      <CardHeader className="pb-2">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Campaign posters
        </h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Platform tabs */}
        <div className="flex flex-wrap gap-1 border-b border-border/60 pb-2">
          {PRESET_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setActivePreset(id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activePreset === id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              {LAYOUT_PRESET_LABELS[id]}
            </button>
          ))}
        </div>

        {/* Live preview with optional logo overlay (contrast-safe badge) */}
        <div className="flex justify-center rounded-lg overflow-hidden border border-border/60 bg-muted/30 relative">
          {loading ? (
            <div className="flex items-center justify-center min-h-[280px] w-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : activeUrl ? (
            <>
              <img
                src={activeUrl}
                alt={`Poster ${LAYOUT_PRESET_LABELS[activePreset]}`}
                className="max-h-[420px] w-auto object-contain"
              />
              {(brandLogoUrl ?? brandLogoLightUrl ?? brandLogoDarkUrl) && (
                <div
                  className="absolute top-3 right-3 flex items-center justify-center rounded-lg bg-black/45 p-2"
                  style={{ width: 56, height: 40 }}
                >
                  <img
                    src={brandLogoUrl ?? brandLogoLightUrl ?? brandLogoDarkUrl ?? ""}
                    alt=""
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Copy summary (event-style blocks when available, else standard copy) */}
        {(campaignInfo || copy) && (
          <div className="text-xs text-muted-foreground space-y-1">
            {campaignInfo ? (
              <>
                {campaignInfo.kicker && (
                  <p><span className="font-medium text-foreground">Kicker:</span> {campaignInfo.kicker}</p>
                )}
                <p><span className="font-medium text-foreground">Headline:</span> {campaignInfo.headline}</p>
                {campaignInfo.subHeadline && (
                  <p><span className="font-medium text-foreground">Subline:</span> {campaignInfo.subHeadline}</p>
                )}
                {campaignInfo.eventDetails && (
                  <p><span className="font-medium text-foreground">Event:</span> {campaignInfo.eventDetails}</p>
                )}
                <p><span className="font-medium text-foreground">CTA:</span> {campaignInfo.cta}</p>
              </>
            ) : (
              <>
                <p><span className="font-medium text-foreground">Headline:</span> {copy!.headline}</p>
                {copy!.subline && (
                  <p><span className="font-medium text-foreground">Subline:</span> {copy!.subline}</p>
                )}
                <p><span className="font-medium text-foreground">CTA:</span> {copy!.cta}</p>
              </>
            )}
          </div>
        )}

        {/* Download */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={!activeUrl}
          className="w-full sm:w-auto"
        >
          <Download className="mr-2 h-4 w-4" />
          Download PNG
        </Button>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
