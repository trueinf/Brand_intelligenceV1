"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BrandKit } from "@/lib/brand-kit/brand-kit.types";
import { DEFAULT_BRAND_KITS } from "@/lib/brand-kit/default-kits";
import { Save, Upload, Loader2 } from "lucide-react";

const FONT_OPTIONS = [
  "Oswald",
  "Roboto",
  "Playfair Display",
  "Lora",
  "Inter",
  "system-ui",
];

const TONE_OPTIONS: BrandKit["tone"][] = ["luxury", "modern", "playful", "corporate"];
const BUTTON_STYLES: BrandKit["buttonStyle"][] = ["solid", "outline", "ghost"];

const defaultKit: BrandKit = {
  brandName: "",
  logoUrl: "",
  primaryColor: "#111111",
  secondaryColor: "#ffffff",
  accentColor: "#6b7280",
  fontHeadline: "system-ui",
  fontBody: "system-ui",
  buttonStyle: "solid",
  tone: "modern",
  visualStyle: "",
};

export default function BrandKitPage() {
  const [kit, setKit] = useState<BrandKit>(defaultKit);
  const [loadName, setLoadName] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadKit = useCallback(async (name: string) => {
    if (!name.trim()) return;
    setMessage(null);
    try {
      const res = await fetch(`/api/brand-kit?brandName=${encodeURIComponent(name.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setKit({ ...defaultKit, ...data });
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Load failed" });
    }
  }, []);

  const handleSave = async () => {
    if (!kit.brandName.trim()) {
      setMessage({ type: "error", text: "Brand name is required" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/brand-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kit),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setMessage({ type: "success", text: "Brand kit saved." });
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload-logo", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setKit((prev) => ({ ...prev, logoUrl: data.url ?? "" }));
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Brand Kit</h1>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <h2 className="text-sm font-semibold">Load existing</h2>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            {Object.keys(DEFAULT_BRAND_KITS).map((name) => (
              <Button
                key={name}
                variant="outline"
                size="sm"
                onClick={() => {
                  setLoadName(name);
                  loadKit(name);
                }}
              >
                {name}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Or type brand name and load"
              value={loadName}
              onChange={(e) => setLoadName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadKit(loadName)}
            />
            <Button variant="secondary" onClick={() => loadKit(loadName)}>
              Load
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <h2 className="text-sm font-semibold">Edit kit</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Brand name</label>
            <Input
              value={kit.brandName}
              onChange={(e) => setKit((p) => ({ ...p, brandName: e.target.value }))}
              placeholder="e.g. Acme"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Logo</label>
            <div className="flex gap-2 items-center">
              <Input
                value={kit.logoUrl}
                onChange={(e) => setKit((p) => ({ ...p, logoUrl: e.target.value }))}
                placeholder="Logo URL or upload"
              />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                />
                <Button type="button" variant="outline" size="icon" disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
              </label>
            </div>
            {kit.logoUrl ? (
              <div className="mt-2 h-12 w-32 relative rounded border overflow-hidden bg-muted/30">
                <img src={kit.logoUrl} alt="" className="object-contain w-full h-full" />
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Primary</label>
              <div className="flex gap-1">
                <input
                  type="color"
                  value={kit.primaryColor}
                  onChange={(e) => setKit((p) => ({ ...p, primaryColor: e.target.value }))}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={kit.primaryColor}
                  onChange={(e) => setKit((p) => ({ ...p, primaryColor: e.target.value }))}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Secondary</label>
              <div className="flex gap-1">
                <input
                  type="color"
                  value={kit.secondaryColor}
                  onChange={(e) => setKit((p) => ({ ...p, secondaryColor: e.target.value }))}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={kit.secondaryColor}
                  onChange={(e) => setKit((p) => ({ ...p, secondaryColor: e.target.value }))}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Accent</label>
              <div className="flex gap-1">
                <input
                  type="color"
                  value={kit.accentColor || "#6b7280"}
                  onChange={(e) => setKit((p) => ({ ...p, accentColor: e.target.value }))}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={kit.accentColor ?? ""}
                  onChange={(e) => setKit((p) => ({ ...p, accentColor: e.target.value || undefined }))}
                  className="flex-1 font-mono text-sm"
                  placeholder="optional"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Font headline</label>
              <select
                value={kit.fontHeadline}
                onChange={(e) => setKit((p) => ({ ...p, fontHeadline: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Font body</label>
              <select
                value={kit.fontBody}
                onChange={(e) => setKit((p) => ({ ...p, fontBody: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Tone</label>
            <div className="flex gap-1 flex-wrap">
              {TONE_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setKit((p) => ({ ...p, tone: t }))}
                  className={`rounded-md px-3 py-1.5 text-sm capitalize ${
                    kit.tone === t ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Button style</label>
            <div className="flex gap-2 flex-wrap items-center">
              {BUTTON_STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setKit((p) => ({ ...p, buttonStyle: s }))}
                  className="rounded-md px-4 py-2 text-sm font-medium capitalize border-2 transition-colors"
                  style={
                    s === "solid"
                      ? { backgroundColor: kit.secondaryColor, color: kit.primaryColor, borderColor: kit.secondaryColor }
                      : s === "outline"
                        ? { backgroundColor: "transparent", color: kit.secondaryColor, borderColor: kit.secondaryColor }
                        : { backgroundColor: "transparent", color: kit.secondaryColor, borderColor: "transparent" }
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Visual style (description)</label>
            <Input
              value={kit.visualStyle}
              onChange={(e) => setKit((p) => ({ ...p, visualStyle: e.target.value }))}
              placeholder="e.g. Minimal, premium"
            />
          </div>

          <div className="pt-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">CTA button preview</p>
            <div
              className="inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-semibold border-2"
              style={{
                backgroundColor: kit.buttonStyle === "solid" ? kit.secondaryColor : "transparent",
                color: kit.buttonStyle === "solid" ? kit.primaryColor : kit.secondaryColor,
                borderColor: kit.buttonStyle === "ghost" ? "transparent" : kit.secondaryColor,
              }}
            >
              Call to action
            </div>
          </div>
        </CardContent>
      </Card>

      {message && (
        <p className={`text-sm mb-4 ${message.type === "error" ? "text-destructive" : "text-green-600"}`}>
          {message.text}
        </p>
      )}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save brand kit
      </Button>
    </div>
  );
}
