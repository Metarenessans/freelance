import { NextRequest, NextResponse } from "next/server";
import { invalidateSchemaCache } from "@/components/common/json-ld/schema-cache";
import { revalidatePath, revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

const EXPECTED_SECRET =
  process.env.REVALIDATION_SECRET;

function purgeTag(tag: string) {
  try {
    revalidateTag(tag, { expire: 0 });
  } catch (e) {
    // ignore
  }
}

function triggerRevalidation(type?: string, slug?: string) {
  try {
    if (type === "product") {
      if (slug) {
        revalidatePath(`/product/${slug}`);
      }
      revalidatePath("/catalog/[slug]", "page");
      purgeTag("products");
      purgeTag("catalog");
      purgeTag("schema");
    } else if (type === "section") {
      if (slug) {
        revalidatePath(`/catalog/${slug}`);
      }
      revalidatePath("/catalog/[slug]", "page");
      purgeTag("sections");
      purgeTag("catalog");
      purgeTag("schema");
    } else if (type === "category") {
      revalidatePath("/catalog/[slug]", "page");
      purgeTag("categories");
      purgeTag("catalog");
      purgeTag("schema");
    } else if (type === "blog") {
      revalidatePath("/blog");
      if (slug) {
        revalidatePath(`/blog/${slug}`);
        purgeTag(`blog-${slug}`);
      }
      purgeTag("blog");
    } else if (type === "calculate") {
      revalidatePath("/calculate");
      purgeTag("calculate");
      purgeTag("schema");
    } else if (type === "privacy" || type === "legal_document") {
      if (slug) {
        revalidatePath(`/${slug}`);
        purgeTag(`legal-${slug}`);
      }
      revalidatePath("/privacy-policy");
      revalidatePath("/user-agreement");
      revalidatePath("/public-offer");
      purgeTag("company");
      purgeTag("legal");
    } else {
      revalidatePath("/", "layout");
      purgeTag("catalog");
      purgeTag("sections");
      purgeTag("products");
      purgeTag("categories");
      purgeTag("blog");
      purgeTag("company");
      purgeTag("schema");
      purgeTag("faq");
    }
  } catch (e) {
    // ignore
  }
}

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

    triggerRevalidation(type, slug);

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

  triggerRevalidation(type, slug);

  return NextResponse.json({
    ok: true,
    message: `Schema cache invalidated for ${type}`,
    details: result,
  });
}
