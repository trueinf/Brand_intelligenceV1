/**
 * POST /api/generate-poster
 * Body: { imageUrl, campaignBrief, brandLogoUrl?, brandLogoLightUrl?, brandLogoDarkUrl?, brandName?, campaignInfoInput? }
 * When campaignInfoInput (brandName + campaignObjective) is set, generates informative blocks and renders objective-aware posters.
 * Logo: preloaded server-side to data URL; optional light/dark variant; contrast badge; failsafe.
 */

import { NextResponse } from "next/server";
import { generatePosterCopy } from "@/lib/poster-engine/copy-generator";
import { composePoster } from "@/lib/poster-engine/poster-composer";
import {
  LAYOUT_PRESETS,
  type LayoutPresetId,
} from "@/lib/poster-engine/layout-presets";
import {
  loadImageAsDataUrl,
  sampleBackgroundBrightness,
  chooseLogoVariantUrl,
} from "@/lib/poster-engine/logo-loader";
import { getBrandKit } from "@/lib/brand-kit/load-brand-kit";
import { generateCampaignInformation } from "@/lib/campaign-info/campaign-info.service";
import { getBlockRenderConfig } from "@/lib/campaign-info/block-render-map";
import type { CampaignInfoInput, CampaignInfoOutput } from "@/lib/campaign-info/campaign-info.types";
import { storeAsset } from "@/lib/storage/blob";
import type { CampaignBrief } from "@/types/campaign";
import type { PosterCopy, PosterLayout } from "@/types/poster";
import { getLayoutPlan } from "@/lib/visual-hierarchy-engine";
import type { VisualHierarchyInput } from "@/lib/visual-hierarchy-engine";

function toAbsoluteUrl(pathOrUrl: string, baseUrl: string): string {
  const s = pathOrUrl.trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  const base = baseUrl.replace(/\/$/, "");
  return s.startsWith("/") ? `${base}${s}` : `${base}/${s}`;
}

function getBaseUrl(request: Request): string {
  try {
    return new URL(request.url).origin;
  } catch {
    if (typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL)
      return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    if (typeof process.env.VERCEL_URL === "string")
      return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
  }
}

function buildVisualHierarchyInput(
  campaignBrief: CampaignBrief,
  brandName: string | null
): VisualHierarchyInput {
  return {
    brandData: { name: brandName ?? "" },
    campaignData: {
      goal: campaignBrief.objective,
      channel: campaignBrief.primaryChannel,
      audience: campaignBrief.targetAudience,
      keyMessage: campaignBrief.keyMessage,
      cta: campaignBrief.callToAction,
    },
    creativeConcept: {
      mood: campaignBrief.emotionalHook,
      sceneType: campaignBrief.visualStyle,
    },
    imageMeta: {},
  };
}

/** Override preset layout with hierarchy plan (logoPosition, textAlignment). */
function layoutWithHierarchy(
  base: PosterLayout,
  logo: string,
  copyBlockAlignment: string
): PosterLayout {
  const logoPosition: "top" | "bottom" =
    logo === "top-right" ? "top" : "bottom";
  const textAlignment: "left" | "center" =
    copyBlockAlignment === "center" ? "center" : "left";
  return { ...base, logoPosition, textAlignment };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl : "";
    const campaignBrief = body?.campaignBrief as CampaignBrief | undefined;
    const brandLogoUrl =
      typeof body?.brandLogoUrl === "string" ? body.brandLogoUrl : null;
    const brandLogoLightUrl =
      typeof body?.brandLogoLightUrl === "string" ? body.brandLogoLightUrl : null;
    const brandLogoDarkUrl =
      typeof body?.brandLogoDarkUrl === "string" ? body.brandLogoDarkUrl : null;
    const brandName = typeof body?.brandName === "string" ? body.brandName : null;
    const campaignInfoInput = body?.campaignInfoInput as CampaignInfoInput | undefined;

    if (!imageUrl || !campaignBrief?.keyMessage) {
      return NextResponse.json(
        { error: "Missing imageUrl or campaignBrief" },
        { status: 400 }
      );
    }

    const baseUrl = getBaseUrl(request);

    const brandKit = brandName ? await getBrandKit(brandName) : null;
    const defaultLogoUrl = brandLogoUrl
      ? toAbsoluteUrl(brandLogoUrl, baseUrl)
      : brandKit?.logoUrl
        ? toAbsoluteUrl(brandKit.logoUrl, baseUrl)
        : null;
    const lightUrl = brandLogoLightUrl
      ? toAbsoluteUrl(brandLogoLightUrl, baseUrl)
      : null;
    const darkUrl = brandLogoDarkUrl
      ? toAbsoluteUrl(brandLogoDarkUrl, baseUrl)
      : null;

    const brandKitWithAbsoluteLogo =
      brandKit && brandKit.logoUrl
        ? { ...brandKit, logoUrl: toAbsoluteUrl(brandKit.logoUrl, baseUrl) }
        : brandKit;

    const copy: PosterCopy = await generatePosterCopy(campaignBrief);
    const absoluteImageUrl = toAbsoluteUrl(imageUrl, baseUrl);

    const hierarchyInput = buildVisualHierarchyInput(campaignBrief, brandName);
    const hierarchyPlan = getLayoutPlan(hierarchyInput);

    let campaignInfo: CampaignInfoOutput | null = null;
    let blockRenderConfig: ReturnType<typeof getBlockRenderConfig> | null = null;
    if (
      campaignInfoInput?.brandName &&
      campaignInfoInput?.campaignObjective &&
      campaignInfoInput?.valueProposition
    ) {
      try {
        const input: CampaignInfoInput = {
          brandName: campaignInfoInput.brandName,
          campaignObjective: campaignInfoInput.campaignObjective,
          productName: campaignInfoInput.productName,
          offer: campaignInfoInput.offer,
          location: campaignInfoInput.location,
          date: campaignInfoInput.date,
          time: campaignInfoInput.time,
          valueProposition:
            campaignInfoInput.valueProposition ||
            campaignBrief?.valueProposition ||
            campaignBrief?.keyMessage ||
            "",
          targetAudience:
            campaignInfoInput.targetAudience || campaignBrief?.targetAudience || "",
          brandTone: campaignInfoInput.brandTone || campaignBrief?.visualStyle || "",
        };
        campaignInfo = await generateCampaignInformation(input);
        blockRenderConfig = getBlockRenderConfig(input.campaignObjective);
      } catch (e) {
        console.warn("[generate-poster] Campaign info generation failed, using standard copy:", e);
      }
    }

    let logoDataUrl: string | null = null;
    if (defaultLogoUrl || lightUrl || darkUrl) {
      let chosenUrl: string | null = defaultLogoUrl ?? null;
      if (lightUrl && darkUrl) {
        try {
          const brightness = await sampleBackgroundBrightness(absoluteImageUrl);
          chosenUrl = chooseLogoVariantUrl(lightUrl, darkUrl, brightness);
        } catch {
          chosenUrl = defaultLogoUrl ?? lightUrl ?? darkUrl;
        }
      } else {
        chosenUrl = defaultLogoUrl ?? lightUrl ?? darkUrl;
      }
      if (chosenUrl) {
        try {
          logoDataUrl = await loadImageAsDataUrl(chosenUrl);
        } catch (e) {
          console.warn("[generate-poster] Logo preload failed, skipping logo:", e);
        }
      }
    }

    const posters: Record<string, string> = {};

    for (const presetId of Object.keys(LAYOUT_PRESETS) as LayoutPresetId[]) {
      const baseLayout = LAYOUT_PRESETS[presetId];
      const layout = layoutWithHierarchy(
        baseLayout,
        hierarchyPlan.placement.logo,
        hierarchyPlan.placement.copyBlockAlignment
      );
      const response = await composePoster({
        imageUrl: absoluteImageUrl,
        copy,
        layout,
        campaignInfo: campaignInfo ?? undefined,
        blockRenderConfig: blockRenderConfig ?? undefined,
        brandLogoUrl: defaultLogoUrl,
        brandLogoLightUrl: lightUrl,
        brandLogoDarkUrl: darkUrl,
        logoDataUrl,
        brandKit: brandKitWithAbsoluteLogo,
      });
      const buffer = Buffer.from(await response.arrayBuffer());
      const url = await storeAsset("image", buffer, {
        prefix: `poster-${presetId}`,
        extension: "png",
      });
      posters[presetId] = url;
    }

    return NextResponse.json({
      copy,
      campaignInfo: campaignInfo ?? undefined,
      posters,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Poster generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
