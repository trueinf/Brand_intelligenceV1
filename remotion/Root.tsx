/**
 * Remotion root: registers the Strategy Video composition.
 * Duration is derived from scenes (5 seconds per scene, 30 fps).
 */

import React from "react";
import { Composition } from "remotion";
import { StrategyVideo, getStrategyVideoDuration } from "./StrategyVideo";
import type { StrategyVideoProps } from "./StrategyVideo";

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;
const COMPOSITION_ID = "StrategyVideo";

const defaultProps: StrategyVideoProps = {
  title: "Strategy Overview",
  scenes: [
    { heading: "Intro", text: "Loading…", visual_hint: "title" },
  ],
  audioUrl: "",
  brandKit: null,
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition<StrategyVideoProps>
      id={COMPOSITION_ID}
      component={StrategyVideo}
      durationInFrames={getStrategyVideoDuration(defaultProps.scenes.length)}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={defaultProps}
      calculateMetadata={({ props }) => {
        const durationInFrames = getStrategyVideoDuration(props.scenes.length);
        return {
          durationInFrames,
          fps: FPS,
          width: WIDTH,
          height: HEIGHT,
        };
      }}
    />
  );
};
