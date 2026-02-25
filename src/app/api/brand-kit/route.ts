/**
 * GET /api/brand-kit?brandName=...
 * Returns Brand Kit for the given brand name (DB or default fallback).
 *
 * POST /api/brand-kit
 * Body: BrandKit — create or update kit by brandName.
 */

import { NextResponse } from "next/server";
import { getBrandKit } from "@/lib/brand-kit/load-brand-kit";
import { prisma } from "@/lib/prisma";
import type { BrandKit } from "@/lib/brand-kit/brand-kit.types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const brandName = searchParams.get("brandName")?.trim();
    if (!brandName) {
      return NextResponse.json(
        { error: "Missing brandName query" },
        { status: 400 }
      );
    }
    const kit = await getBrandKit(brandName);
    return NextResponse.json(kit);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Brand kit failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const kit = body as BrandKit;
    if (!kit?.brandName?.trim()) {
      return NextResponse.json(
        { error: "Missing brandName" },
        { status: 400 }
      );
    }
    await prisma.brandKit.upsert({
      where: { brandName: kit.brandName.trim() },
      create: {
        brandName: kit.brandName.trim(),
        logoUrl: kit.logoUrl ?? "",
        primaryColor: kit.primaryColor ?? "#111111",
        secondaryColor: kit.secondaryColor ?? "#ffffff",
        fontHeadline: kit.fontHeadline ?? "system-ui",
        fontBody: kit.fontBody ?? "system-ui",
        tone: kit.tone ?? "modern",
        accentColor: kit.accentColor ?? null,
        buttonStyle: kit.buttonStyle ?? "solid",
        visualStyle: kit.visualStyle ?? null,
      },
      update: {
        logoUrl: kit.logoUrl ?? "",
        primaryColor: kit.primaryColor ?? "#111111",
        secondaryColor: kit.secondaryColor ?? "#ffffff",
        fontHeadline: kit.fontHeadline ?? "system-ui",
        fontBody: kit.fontBody ?? "system-ui",
        tone: kit.tone ?? "modern",
        accentColor: kit.accentColor ?? null,
        buttonStyle: kit.buttonStyle ?? "solid",
        visualStyle: kit.visualStyle ?? null,
      },
    });
    const saved = await getBrandKit(kit.brandName.trim());
    return NextResponse.json(saved);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save brand kit failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
