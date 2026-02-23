"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FolderOpen, LayoutGrid, Video, ImageIcon } from "lucide-react";

type AssetItem = { type: "video" | "image"; url: string; title?: string };

export default function AssetsPage() {
  const [videos, setVideos] = useState<AssetItem[]>([]);
  const [images, setImages] = useState<AssetItem[]>([]);

  useEffect(() => {
    // In a full implementation, fetch from API (e.g. GET /api/assets or list public/videos, public/creatives).
    // For now we show placeholder copy; assets appear after user generates from dashboard/campaign-studio.
    setVideos([]);
    setImages([]);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 sticky top-0 z-10 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Asset Library
          </h1>
          <nav className="flex gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LayoutGrid className="h-4 w-4" /> Dashboard
            </Link>
            <Link
              href="/campaign-studio"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Campaign Studio
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <p className="text-sm text-muted-foreground mb-6">
          Generated videos and creatives. Export videos from the Dashboard; generate images in Campaign Studio.
        </p>

        <section className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Video className="h-4 w-4" /> Videos
          </h2>
          {videos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-muted-foreground">
              <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-60" />
              <p className="text-sm">No videos yet.</p>
              <p className="text-xs mt-1">Generate a strategy video from the Dashboard, then download the MP4.</p>
              <Link href="/dashboard" className="mt-3 inline-block text-sm text-primary hover:underline">
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((v, i) => (
                <a
                  key={i}
                  href={v.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-border bg-card p-4 shadow-sm hover:bg-muted/50"
                >
                  <span className="text-sm font-medium text-foreground">{v.title ?? "Strategy video"}</span>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{v.url}</p>
                </a>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> Images
          </h2>
          {images.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-muted-foreground">
              <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-60" />
              <p className="text-sm">No creatives yet.</p>
              <p className="text-xs mt-1">Generate campaign creatives in Campaign Studio.</p>
              <Link href="/campaign-studio" className="mt-3 inline-block text-sm text-primary hover:underline">
                Go to Campaign Studio
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((img, i) => (
                <a
                  key={i}
                  href={img.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-border bg-card overflow-hidden shadow-sm block"
                >
                  <img src={img.url} alt={img.title ?? "Creative"} className="w-full aspect-square object-cover" />
                  {img.title && <p className="p-2 text-xs text-muted-foreground truncate">{img.title}</p>}
                </a>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
