/**
 * Shared in-memory job store for async video generation.
 * Used by /api/generate-video and /api/video-status (same Node process).
 */

export type VideoJobStatus =
  | "generating_script"
  | "generating_voiceover"
  | "generating_visuals"
  | "rendering_video"
  | "completed"
  | "failed";

export type VideoJob = {
  status: VideoJobStatus;
  progress: number;
  videoUrl?: string;
  error?: string;
};

export const videoJobs = new Map<string, VideoJob>();

const STATUS_PROGRESS: Record<VideoJobStatus, number> = {
  generating_script: 20,
  generating_voiceover: 40,
  generating_visuals: 60,
  rendering_video: 90,
  completed: 100,
  failed: 0,
};

export function setVideoJob(
  jobId: string,
  update: Partial<Pick<VideoJob, "status" | "progress" | "videoUrl" | "error">>
): void {
  const current = videoJobs.get(jobId);
  const status = update.status ?? current?.status ?? "generating_script";
  const progress =
    update.progress ??
    (update.status ? STATUS_PROGRESS[update.status] : current?.progress ?? 10);
  videoJobs.set(jobId, {
    status,
    progress,
    videoUrl: update.videoUrl ?? current?.videoUrl,
    error: update.error ?? current?.error,
  });
}

export function getVideoJob(jobId: string): VideoJob | undefined {
  return videoJobs.get(jobId);
}
