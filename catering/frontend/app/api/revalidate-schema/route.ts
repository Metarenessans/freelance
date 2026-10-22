import { NextRequest, NextResponse } from "next/server";
import { invalidateSchemaCache } from "@/components/common/json-ld/schema-cache";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const EXPECTED_SECRET =
  process.env.REVALIDATION_SECRET;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const secret =
      body.secret || req.headers.get("x-revalidation-secret");

    if (!EXPECTED_SECRET || secret !== EXPECTED_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, slug } = body;
    const result = invalidateSchemaCache({ type, slug });

    // Next.js native revalidation
    try {
      if (type === "product" && slug) {
        revalidatePath(`/product/${slug}`);
        revalidatePath("/catalog/[slug]", "page");
      } else if (type === "section" && slug) {
        revalidatePath(`/catalog/${slug}`);
      } else if (type === "blog") {
        revalidatePath("/blog");
        if (slug) {
          revalidatePath(`/blog/${slug}`);
        }
      } else if (type === "calculate") {
        revalidatePath("/calculate");
      } else if (type === "privacy" || type === "legal_document") {
        if (slug) {
          revalidatePath(`/${slug}`);
        }
        revalidatePath("/privacy-policy");
        revalidatePath("/user-agreement");
        revalidatePath("/public-offer");
      } else {
        revalidatePath("/", "layout");
      }
    } catch (e) {
      // ignore
    }

    return NextResponse.json({
      ok: true,
      message: `Schema cache invalidated for ${type || "all"}`,
      details: result,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");

  if (!EXPECTED_SECRET || secret !== EXPECTED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = url.searchParams.get("type") || "all";
  const slug = url.searchParams.get("slug") || "";
  const result = invalidateSchemaCache({ type, slug });

  return NextResponse.json({
    ok: true,
    message: `Schema cache invalidated for ${type}`,
    details: result,
  });
}
