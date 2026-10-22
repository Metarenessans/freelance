import { Metadata } from "next";
import { notFound } from "next/navigation";
import SectionDetailPage from "@/components/pages/section-detail-page";
import { buildSectionTitle, buildSectionDescription, getSectionAltText, toPublicMediaUrl } from "@/utils/seo";
import {
  JsonLd,
  getCachedJsonLd,
  getCachedSections,
  getCachedCategories,
  getCachedProducts,
  getCachedCompanyInfo,
  getCachedFooterNav,
} from "@/components/common/json-ld";

export const dynamic = "force-dynamic";

import type { Section, Category } from "@/store/services/catalogApi";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [sections, categories, companyInfo] = await Promise.all([
    getCachedSections(),
    getCachedCategories(),
    getCachedCompanyInfo(),
  ]);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");

  const section = sections.find((s) => s.id === slug);

  if (!section) {
    const fallbackTitle = "Buffet menu - buffet food catalog";
    const fallbackDesc =
      "Explore buffet platters and appetizers from Chef Meal Catering. Delicious ready-made party food with delivery in Naberezhnye Chelny!";
    return {
      title: fallbackTitle,
      description: fallbackDesc,
      alternates: {
        canonical: `/catalog/${slug}`,
      },
      openGraph: {
        title: `${fallbackTitle} | Chef Meal Catering`,
        description: fallbackDesc,
        url: `${baseUrl}/catalog/${slug}`,
      },
      twitter: {
        card: "summary_large_image",
        title: `${fallbackTitle} | Chef Meal Catering`,
        description: fallbackDesc,
      },
    };
  }

  // Get category names for this section.
  const rawCatNames = (section.categories || [])
    .map((catId: string) => categories.find((c: Category) => c.id === catId)?.name)
    .filter((name: string | undefined): name is string => Boolean(name));

  const customTitle = (section as any).seoTitle || (section as any).seo_title;
  const customDesc = (section as any).seoDescription || (section as any).seo_description;

  const title = customTitle?.trim() || buildSectionTitle(section.name);
  const description = customDesc?.trim() || buildSectionDescription({
    sectionName: section.name,
    categories: rawCatNames,
    maxLen: 155,
  });

  const imageUrl = toPublicMediaUrl(companyInfo?.ogImage || section.imageUrl, baseUrl) || undefined;
  const imageAlt = companyInfo?.ogImage
    ? "Chef Meal Catering - catering and buffet delivery in Naberezhnye Chelny"
    : getSectionAltText(section.name);

  const fullTitle = title.includes("Chef Meal") ? title : `${title} | Chef Meal Catering`;

  return {
    title: {
      absolute: fullTitle,
    },
    description,
    alternates: {
      canonical: `/catalog/${slug}`,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: `${baseUrl}/catalog/${slug}`,
      images: imageUrl ? [{ url: imageUrl, alt: imageAlt }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function CatalogSectionPage({ params }: PageProps) {
  const { slug } = await params;
  const [jsonLd, sections, categories, products, companyInfo, footerNav] =
    await Promise.all([
      getCachedJsonLd(`/catalog/${slug}`),
      getCachedSections(),
      getCachedCategories(),
      getCachedProducts(),
      getCachedCompanyInfo(),
      getCachedFooterNav(),
    ]);

  // Keep only products belonging to this section.
  const currentSection = sections.find((s) => s.id === slug);
  if (!currentSection) {
    notFound();
  }
  const sectionCatIds = new Set<string>();
  if (currentSection?.categories) {
    currentSection.categories.forEach((cid) => sectionCatIds.add(cid));
  }
  categories.forEach((c) => {
    if (c.sectionId === slug || (c.sectionIds && c.sectionIds.includes(slug))) {
      sectionCatIds.add(c.id);
    }
  });

  const sectionProducts = products.filter(
    (p) => p.categoryId && sectionCatIds.has(p.categoryId)
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <SectionDetailPage
        slug={slug}
        initialSections={sections}
        initialCategories={categories}
        initialProducts={sectionProducts}
        initialCompanyInfo={companyInfo}
        initialFooterNav={footerNav}
      />
    </>
  );
}
