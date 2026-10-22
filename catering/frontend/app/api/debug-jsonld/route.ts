import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getCachedJsonLd } from "@/components/common/json-ld/schema-cache";
import { isDebugJsonFileEnabled } from "@/components/common/json-ld/server-catalog-cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not found", { status: 404 });
  }
  try {
    const enabled = await isDebugJsonFileEnabled();
    const url = new URL(req.url);
    const targetPath = url.searchParams.get("path") || "/";
    const t0 = performance.now();
    const jsonLd = await getCachedJsonLd(targetPath);
    const t1 = performance.now();

    if (enabled) {
      const filePath = path.join(process.cwd(), "schema_markup_debug.json");
      fs.writeFileSync(filePath, JSON.stringify(jsonLd, null, 2), "utf-8");
    }

    return NextResponse.json({
      ok: true,
      path: targetPath,
      debugFileCreated: enabled,
      timeSchemaMs: Number((t1 - t0).toFixed(2)),
      jsonLd,
    });
  } catch (e) {
    console.error("Failed to generate and write debug JSON-LD:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not found", { status: 404 });
  }
  try {
    const enabled = await isDebugJsonFileEnabled();
    const body = await req.json();
    let jsonLd = body.jsonLd || body;

    if (body.path && !body.jsonLd) {
      jsonLd = await getCachedJsonLd(body.path);
    }

    if (enabled) {
      const filePath = path.join(process.cwd(), "schema_markup_debug.json");
      fs.writeFileSync(filePath, JSON.stringify(jsonLd, null, 2), "utf-8");
    }

    return NextResponse.json({ ok: true, debugFileCreated: enabled, jsonLd });
  } catch (e) {
    console.error("Failed to write schema_markup_debug.json from client:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
