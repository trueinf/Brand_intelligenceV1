"use client";

import { Player } from "@remotion/player";
import { StrategyVideo, getStrategyVideoDuration } from "../../../remotion/StrategyVideo";
import type { VideoScript } from "@/types/video";

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

export interface StrategyVideoPlayerProps {
  title: string;
  scenes: VideoScript["scenes"];
  audioUrl: string;
}

export function StrategyVideoPlayer({ title, scenes, audioUrl }: StrategyVideoPlayerProps) {
  return (
    <Player
      component={StrategyVideo}
      inputProps={{ title, scenes, audioUrl }}
      durationInFrames={getStrategyVideoDuration(scenes.length)}
      compositionWidth={WIDTH}
      compositionHeight={HEIGHT}
      fps={FPS}
      style={{ width: "100%", height: "100%" }}
      controls
      loop
    />
  );
}
