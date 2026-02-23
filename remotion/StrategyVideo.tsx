/**
 * Strategy video composition: animated scenes + voiceover.
 * Props: title, scenes, audioUrl; optional brandKit for colors, font, logo watermark.
 */

import React from "react";
import {
  Audio,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type VideoScene = { heading: string; text: string; visual_hint: string };

export type BrandKitVideo = {
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  fontHeadline: string;
  fontBody: string;
};

const FPS = 30;
const SECONDS_PER_SCENE = 5;
const FRAMES_PER_SCENE = FPS * SECONDS_PER_SCENE;

export type StrategyVideoProps = {
  title: string;
  scenes: VideoScene[];
  audioUrl: string;
  brandKit?: BrandKitVideo | null;
};

export type { VideoScene };

export const StrategyVideo: React.FC<StrategyVideoProps> = ({
  title,
  scenes,
  audioUrl,
  brandKit,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const currentSceneIndex = Math.min(
    Math.floor(frame / FRAMES_PER_SCENE),
    scenes.length - 1
  );
  const sceneFrame = frame - currentSceneIndex * FRAMES_PER_SCENE;
  const scene = scenes[currentSceneIndex];

  const isFirstScene = currentSceneIndex === 0;

  const fadeIn = interpolate(
    sceneFrame,
    [0, 30],
    [0, 1],
    { extrapolateRight: "clamp" }
  );
  const scaleBg = interpolate(
    sceneFrame,
    [0, FRAMES_PER_SCENE],
    [1, 1.05],
    { extrapolateRight: "clamp" }
  );
  const slideX = interpolate(
    sceneFrame,
    [0, 20],
    [50, 0],
    { extrapolateRight: "clamp" }
  );

  const bgGradient = brandKit?.primaryColor
    ? `linear-gradient(135deg, ${brandKit.primaryColor}22 0%, ${brandKit.primaryColor}44 50%, ${brandKit.primaryColor}22 100%)`
    : "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)";
  const titleColor = brandKit?.primaryColor ?? "#f8fafc";
  const subColor = brandKit?.secondaryColor ?? "#94a3b8";
  const bodyColor = brandKit?.secondaryColor ?? "#f1f5f9";
  const fontHeadline = brandKit?.fontHeadline ?? "system-ui, sans-serif";
  const fontBody = brandKit?.fontBody ?? "system-ui, sans-serif";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: bgGradient,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Audio src={audioUrl} />

      {/* Subtle animated background layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)",
          transform: `scale(${scaleBg})`,
          pointerEvents: "none",
        }}
      />

      {isFirstScene ? (
        <div
          style={{
            opacity: fadeIn,
            textAlign: "center",
            transform: `translateX(${slideX}px)`,
          }}
        >
          <h1
            style={{
              fontFamily: fontHeadline,
              fontSize: 72,
              fontWeight: 700,
              color: titleColor,
              margin: 0,
              textShadow: "0 2px 20px rgba(0,0,0,0.3)",
            }}
          >
            {title}
          </h1>
        </div>
      ) : (
        scene && (
          <div
            style={{
              opacity: fadeIn,
              transform: `translateX(${slideX}px)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              maxWidth: 1200,
            }}
          >
            <h2
              style={{
                fontFamily: fontBody,
                fontSize: 42,
                fontWeight: 600,
                color: subColor,
                margin: "0 0 32px 0",
                textTransform: "uppercase",
                letterSpacing: 4,
              }}
            >
              {scene.heading}
            </h2>
            <p
              style={{
                fontFamily: fontBody,
                fontSize: 36,
                lineHeight: 1.5,
                color: bodyColor,
                margin: 0,
                textAlign: "center",
              }}
            >
              {scene.text}
            </p>
          </div>
        )
      )}

      {/* Logo watermark */}
      {brandKit?.logoUrl ? (
        <div
          style={{
            position: "absolute",
            bottom: 24,
            right: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={brandKit.logoUrl}
            alt=""
            style={{ height: 32, width: "auto", objectFit: "contain" }}
          />
        </div>
      ) : null}
    </div>
  );
};

export const getStrategyVideoDuration = (sceneCount: number): number =>
  Math.max(1, sceneCount) * FRAMES_PER_SCENE;
