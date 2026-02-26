"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageLightboxProps {
  open: boolean;
  src: string | null;
  alt?: string;
  onClose: () => void;
  className?: string;
}

/**
 * In-page lightbox to view an image full-size without opening a new tab.
 * Avoids pop-up blocker issues; click image to open, click overlay or close to dismiss.
 */
export function ImageLightbox({ open, src, alt = "Image", onClose, className }: ImageLightboxProps) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4",
        className
      )}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="View image"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
      {src && (
        <img
          src={src}
          alt={alt}
          className="max-h-full max-w-full object-contain"
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />
      )}
    </div>
  );
}
