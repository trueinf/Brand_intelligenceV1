import { NextResponse } from "next/server";
import { createVideoScript } from "@/lib/createVideoScript";
import { createVoiceover } from "@/lib/createVoiceover";
import type { AnalyzeBrandResponse } from "@/types";

/**
 * POST /api/generate-video
 * Body: { dashboardData: AnalyzeBrandResponse }
 * Flow: 1) createVideoScript 2) combine scene text into narration 3) createVoiceover
 * Returns: { title, scenes, audioUrl } for use by Remotion or InVideo.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dashboardData = body?.dashboardData as AnalyzeBrandResponse | undefined;

    if (
      !dashboardData?.brand_overview?.name ||
      !dashboardData?.campaigns ||
      !dashboardData?.insights
    ) {
      return NextResponse.json(
        { error: "Invalid or missing dashboardData" },
        { status: 400 }
      );
    }

    const script = await createVideoScript(dashboardData);
    const narration = script.scenes.map((s) => s.text).join(" ");
    const audioUrl = await createVoiceover(narration);

    return NextResponse.json({
      title: script.title,
      scenes: script.scenes,
      audioUrl,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Video generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
