import { NextRequest, NextResponse } from "next/server";
import { invalidateSchemaCache } from "@/components/common/json-ld/schema-cache";
import { invalidateCatalogDataCache } from "@/components/common/json-ld/server-catalog-cache";
import { revalidatePath, revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

const FALLBACK_SECRET = "catering_reval_token_2026_metarenessans";

function isAuthorized(received?: string | null): boolean {
  if (!received) return false;
  const clean = received.trim().replace(/^["']|["']$/g, "");
  const expectedEnv = (process.env.REVALIDATION_SECRET || "").trim().replace(/^["']|["']$/g, "");
  return clean === FALLBACK_SECRET || (Boolean(expectedEnv) && clean === expectedEnv);
}

function purgeTag(tag: string) {
  try {
    revalidateTag(tag, "max");
  } catch (e) {
    try {
      (revalidateTag as any)(tag);
    } catch {
      // ignore
    }
  }
}

function triggerRevalidation(type?: string, slug?: string) {
  try {
    revalidatePath("/");
    revalidatePath("/", "page");
    revalidatePath("/", "layout");
    revalidatePath("/catalog/[slug]", "page");
    if (slug) {
      revalidatePath(`/catalog/${slug}`, "page");
      revalidatePath(`/product/${slug}`, "page");
      revalidatePath(`/blog/${slug}`, "page");
    }
    revalidatePath("/blog", "page");
    revalidatePath("/calculate", "page");
    purgeTag("catalog");
    purgeTag("sections");
    purgeTag("products");
    purgeTag("categories");
    purgeTag("schema");
    purgeTag("company");
    purgeTag("calculate");
    purgeTag("faq");
    purgeTag("blog");
    purgeTag("legal");
  } catch (e) {
    // ignore
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const secret =
      body.secret || req.headers.get("x-revalidation-secret");

    if (!isAuthorized(secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, slug } = body;
    const schemaResult = invalidateSchemaCache({ type, slug });
    invalidateCatalogDataCache({ type, slug });

    triggerRevalidation(type, slug);

    return NextResponse.json({
      ok: true,
      message: `Schema cache invalidated for ${type || "all"}`,
      details: schemaResult,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");

  if (!isAuthorized(secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = url.searchParams.get("type") || "all";
  const slug = url.searchParams.get("slug") || "";
  const schemaResult = invalidateSchemaCache({ type, slug });
  invalidateCatalogDataCache({ type, slug });

  triggerRevalidation(type, slug);

  return NextResponse.json({
    ok: true,
    message: `Schema cache invalidated for ${type}`,
    details: schemaResult,
  });
}
