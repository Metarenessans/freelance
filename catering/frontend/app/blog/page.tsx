import { toPublicMediaUrl } from "@/utils/seo";
import { Metadata } from "next";
import { BlogPage } from "@/components/pages/blog-page";
import { getArticles } from "@/store/services/blogApi";
import {
  JsonLd,
  getCachedJsonLd,
  getCachedCompanyInfo,
  getCachedFooterNav,
  getCachedSeoSettings,
} from "@/components/common/json-ld";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [articles, companyInfo, seoSettings] = await Promise.all([
    getArticles(),
    getCachedCompanyInfo(),
    getCachedSeoSettings(),
  ]);

  const brandName =
    companyInfo?.legalName ||
    companyInfo?.companyName ||
    "Chef Meal Catering";

  const defaultTitle = "Catering and buffet planning articles";
  const defaultDesc =
    "Chef tips on buffet portions, table settings, party food boxes and event catering in Naberezhnye Chelny. Read the Chef Meal blog!";

  const rawTitle = seoSettings?.blog_title?.trim();
  const rawDesc = seoSettings?.blog_description?.trim();

  const pageTitle = rawTitle || defaultTitle;
  const description = rawDesc || defaultDesc;

  const firstCover = articles[0]?.cover;
  const coverUrl = toPublicMediaUrl(companyInfo?.ogImage) || (firstCover ? toPublicMediaUrl(firstCover) : undefined);

  const fullTitle = pageTitle.includes(brandName) ? pageTitle : `${pageTitle} | ${brandName}`;

  return {
    title: {
      absolute: fullTitle,
    },
    description,
    alternates: {
      canonical: "/blog",
    },
    openGraph: {
      title: fullTitle,
      description,
      url: "http://localhost:3000/blog",
      siteName: brandName,
      type: "website",
      ...(coverUrl
        ? {
            images: [
              {
                url: coverUrl,
                alt: articles[0]?.cover_alt || articles[0]?.title || pageTitle,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: coverUrl ? [coverUrl] : [],
    },
  };
}

export default async function Blog() {
  const [articles, companyInfo, footerNav, jsonLd] = await Promise.all([
    getArticles(),
    getCachedCompanyInfo(),
    getCachedFooterNav(),
    getCachedJsonLd("/blog"),
  ]);

  return (
    <>
      <JsonLd data={jsonLd} />
      <BlogPage
        articles={articles}
        initialCompanyInfo={companyInfo}
        initialFooterNav={footerNav}
      />
    </>
  );
}
