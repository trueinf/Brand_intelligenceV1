/**
 * Compose a campaign poster: background image, gradient, logo (contrast-safe), headline, subline, CTA.
 * Render order: background → gradient overlay → logo (top-right, badge) → text.
 * Uses next/og ImageResponse. Brand Kit applies colors, typography, CTA style.
 */

import React from "react";
import { ImageResponse } from "next/og";
import type { PosterCopy, PosterLayout } from "@/types/poster";
import type { BrandKit } from "@/lib/brand-kit/brand-kit.types";
import type { CampaignInfoOutput } from "@/lib/campaign-info/campaign-info.types";
import type { BlockRenderConfig } from "@/lib/campaign-info/block-render-map";
import { PADDING as LOGO_PADDING } from "./logo-loader";

export interface ComposePosterInput {
  /** Absolute URL for the background image (e.g. https://localhost:3000/creatives/xxx.png) */
  imageUrl: string;
  /** Standard copy (used when campaignInfo not provided) */
  copy: PosterCopy;
  layout: PosterLayout;
  /** When set, poster renders informative blocks (kicker, headline, subHeadline, etc.) in order; copy is ignored */
  campaignInfo?: CampaignInfoOutput | null;
  /** Which blocks to show when using campaignInfo */
  blockRenderConfig?: BlockRenderConfig | null;
  /** Absolute URL for brand logo; optional (overridden by brandKit.logoUrl if present) */
  brandLogoUrl?: string | null;
  /** Light variant (for dark backgrounds); optional */
  brandLogoLightUrl?: string | null;
  /** Dark variant (for light backgrounds); optional */
  brandLogoDarkUrl?: string | null;
  /** Preloaded logo as data URL (server-safe; preferred when set) */
  logoDataUrl?: string | null;
  /** Brand Kit for colors, fonts, CTA style; optional */
  brandKit?: BrandKit | null;
}

/**
 * Returns a Response (PNG image). Caller can await response.arrayBuffer() to get buffer for storage.
 */
export async function composePoster(input: ComposePosterInput): Promise<Response> {
  const {
    imageUrl,
    copy,
    layout,
    campaignInfo,
    blockRenderConfig,
    brandLogoUrl,
    brandLogoLightUrl,
    brandLogoDarkUrl,
    logoDataUrl,
    brandKit,
  } = input;

  const useInfoBlocks = Boolean(campaignInfo && blockRenderConfig);
  const info = campaignInfo;
  const config = blockRenderConfig;
  const { width, height, safePadding, logoPosition, textAlignment } = layout;
  const align = textAlignment === "center" ? "center" : "flex-start";
  const textAlign = textAlignment === "center" ? "center" : "left";

  const logoSource =
    logoDataUrl ??
    (brandKit?.logoUrl && brandKit.logoUrl.trim() !== "" ? brandKit.logoUrl : brandLogoUrl) ??
    null;

  const padding = Math.max(safePadding, LOGO_PADDING);
  const logoWidth = Math.min(Math.round(width * 0.12), 160);
  const logoHeight = Math.round(logoWidth * 0.4);
  const badgePadding = 16;
  const isTop = logoPosition === "top";

  const headlineColor = brandKit?.primaryColor ?? "#ffffff";
  const headlineFont = brandKit?.fontHeadline ?? "system-ui";
  const bodyFont = brandKit?.fontBody ?? "system-ui";
  const ctaBg = brandKit?.secondaryColor ?? "#ffffff";
  const ctaColor = brandKit?.primaryColor ?? "#000000";
  const isOutline = brandKit?.buttonStyle === "outline";
  const isGhost = brandKit?.buttonStyle === "ghost";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 1. Background image */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* 2. Gradient overlay for readability */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.6) 100%)",
          }}
        />
        {/* 3. Logo: top-right or bottom-right, contrast badge, safe positioning (after gradient) */}
        {logoSource ? (
          <div
            style={{
              position: "absolute",
              ...(isTop ? { top: padding, right: padding } : { bottom: padding, right: padding }),
              width: logoWidth + badgePadding * 2,
              height: logoHeight + badgePadding * 2,
              maxWidth: width - padding * 2,
              maxHeight: height * 0.2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.45)",
              borderRadius: 8,
              padding: badgePadding,
            }}
          >
            <img
              src={logoSource}
              alt=""
              width={logoWidth}
              height={logoHeight}
              style={{ objectFit: "contain", maxWidth: logoWidth, maxHeight: logoHeight }}
            />
          </div>
        ) : null}

        {/* 4. Content with safe padding (text) */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: safePadding,
            justifyContent: "space-between",
            alignItems: align,
          }}
        >
          {/* Text block: campaignInfo blocks (kicker → headline → sub → product/experience → event/availability/offer → CTA) or standard copy */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: align,
              width: "100%",
              maxWidth: width - safePadding * 2,
            }}
          >
            {useInfoBlocks && info && config ? (
              <>
                {config.showKicker && info.kicker ? (
                  <p
                    style={{
                      fontSize: Math.round(width / 52),
                      color: "rgba(255,255,255,0.9)",
                      fontFamily: bodyFont,
                      margin: 0,
                      marginBottom: 8,
                      textAlign: textAlign as "left" | "center",
                      textTransform: "uppercase",
                      letterSpacing: 2,
                    }}
                  >
                    {info.kicker}
                  </p>
                ) : null}
                <h1
                  style={{
                    fontSize: Math.round(width / 18),
                    fontWeight: 700,
                    color: headlineColor,
                    fontFamily: headlineFont,
                    margin: 0,
                    textAlign: textAlign as "left" | "center",
                    lineHeight: 1.15,
                    textShadow: "0 2px 12px rgba(0,0,0,0.6)",
                  }}
                >
                  {info.headline}
                </h1>
                {config.showSubHeadline && info.subHeadline ? (
                  <p
                    style={{
                      fontSize: Math.round(width / 42),
                      color: "rgba(255,255,255,0.95)",
                      fontFamily: bodyFont,
                      marginTop: 16,
                      marginBottom: 0,
                      textAlign: textAlign as "left" | "center",
                      textShadow: "0 1px 8px rgba(0,0,0,0.5)",
                    }}
                  >
                    {info.subHeadline}
                  </p>
                ) : null}
                {config.showProductLine && info.productLine ? (
                  <p
                    style={{
                      fontSize: Math.round(width / 45),
                      color: "rgba(255,255,255,0.95)",
                      fontFamily: bodyFont,
                      marginTop: 12,
                      marginBottom: 0,
                      textAlign: textAlign as "left" | "center",
                    }}
                  >
                    {info.productLine}
                  </p>
                ) : null}
                {config.showExperienceLine && info.experienceLine ? (
                  <p
                    style={{
                      fontSize: Math.round(width / 45),
                      color: "rgba(255,255,255,0.95)",
                      fontFamily: bodyFont,
                      marginTop: 12,
                      marginBottom: 0,
                      textAlign: textAlign as "left" | "center",
                    }}
                  >
                    {info.experienceLine}
                  </p>
                ) : null}
                {config.showEventDetails && info.eventDetails ? (
                  <p
                    style={{
                      fontSize: Math.round(width / 48),
                      color: "rgba(255,255,255,0.9)",
                      fontFamily: bodyFont,
                      marginTop: 12,
                      marginBottom: 0,
                      textAlign: textAlign as "left" | "center",
                    }}
                  >
                    {info.eventDetails}
                  </p>
                ) : null}
                {config.showAvailabilityLine && info.availabilityLine ? (
                  <p
                    style={{
                      fontSize: Math.round(width / 48),
                      color: "rgba(255,255,255,0.9)",
                      fontFamily: bodyFont,
                      marginTop: 12,
                      marginBottom: 0,
                      textAlign: textAlign as "left" | "center",
                    }}
                  >
                    {info.availabilityLine}
                  </p>
                ) : null}
                {config.showOfferLine && info.offerLine ? (
                  <p
                    style={{
                      fontSize: Math.round(width / 48),
                      color: "rgba(255,255,255,0.9)",
                      fontFamily: bodyFont,
                      marginTop: 12,
                      marginBottom: 0,
                      textAlign: textAlign as "left" | "center",
                    }}
                  >
                    {info.offerLine}
                  </p>
                ) : null}
                {config.showCta && info.cta ? (
                  <div
                    style={{
                      marginTop: 24,
                      display: "flex",
                      paddingLeft: 24,
                      paddingRight: 24,
                      paddingTop: 14,
                      paddingBottom: 14,
                      backgroundColor: isGhost ? "transparent" : isOutline ? "transparent" : ctaBg,
                      color: isOutline || isGhost ? ctaBg : ctaColor,
                      borderWidth: isOutline || isGhost ? 2 : 0,
                      borderStyle: "solid",
                      borderColor: ctaBg,
                      borderRadius: 8,
                      fontSize: Math.round(width / 48),
                      fontWeight: 600,
                    }}
                  >
                    {info.cta}
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <h1
                  style={{
                    fontSize: Math.round(width / 18),
                    fontWeight: 700,
                    color: headlineColor,
                    fontFamily: headlineFont,
                    margin: 0,
                    textAlign: textAlign as "left" | "center",
                    lineHeight: 1.15,
                    textShadow: "0 2px 12px rgba(0,0,0,0.6)",
                  }}
                >
                  {copy.headline}
                </h1>
                {copy.subline ? (
                  <p
                    style={{
                      fontSize: Math.round(width / 42),
                      color: "rgba(255,255,255,0.95)",
                      fontFamily: bodyFont,
                      marginTop: 16,
                      marginBottom: 0,
                      textAlign: textAlign as "left" | "center",
                      textShadow: "0 1px 8px rgba(0,0,0,0.5)",
                    }}
                  >
                    {copy.subline}
                  </p>
                ) : null}
                {copy.offer ? (
                  <p
                    style={{
                      fontSize: Math.round(width / 48),
                      color: "rgba(255,255,255,0.9)",
                      fontFamily: bodyFont,
                      marginTop: 8,
                      marginBottom: 0,
                      textAlign: textAlign as "left" | "center",
                    }}
                  >
                    {copy.offer}
                  </p>
                ) : null}
                <div
                  style={{
                    marginTop: 24,
                    display: "flex",
                    paddingLeft: 24,
                    paddingRight: 24,
                    paddingTop: 14,
                    paddingBottom: 14,
                    backgroundColor: isGhost ? "transparent" : isOutline ? "transparent" : ctaBg,
                    color: isOutline || isGhost ? ctaBg : ctaColor,
                    borderWidth: isOutline || isGhost ? 2 : 0,
                    borderStyle: "solid",
                    borderColor: ctaBg,
                    borderRadius: 8,
                    fontSize: Math.round(width / 48),
                    fontWeight: 600,
                  }}
                >
                  {copy.cta}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
    }
  );
}
