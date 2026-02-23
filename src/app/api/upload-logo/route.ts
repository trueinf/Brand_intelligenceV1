/**
 * POST /api/upload-logo
 * FormData: file (image)
 * Stores in public/creatives, returns { url }.
 */

import { NextResponse } from "next/server";
import { storeAsset } from "@/lib/storage/blob";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !file.size) {
      return NextResponse.json(
        { error: "Missing or empty file" },
        { status: 400 }
      );
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const safeExt = ["png", "jpg", "jpeg", "svg", "webp"].includes(ext) ? ext : "png";
    const url = await storeAsset("image", buffer, {
      prefix: "logo",
      extension: safeExt,
    });
    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
