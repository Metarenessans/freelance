import type { Metadata } from "next";
import SectionsPage from "@/components/pages/sections-page";
import {
  JsonLd,
  getCachedJsonLd,
  getCachedSections,
  getCachedCompanyInfo,
  getCachedFaq,
  getCachedFooterNav,
  getCachedSeoSettings,
} from "@/components/common/json-ld";
import { getArticles } from "@/store/services/blogApi";
import { toPublicMediaUrl } from "@/utils/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [companyInfo, seoSettings] = await Promise.all([
    getCachedCompanyInfo(),
    getCachedSeoSettings(),
  ]);

  const brandName =
    companyInfo?.legalName ||
    companyInfo?.companyName ||
    "Chef Meal Catering";

  const city = companyInfo?.city?.trim() || "Naberezhnye Chelny";
  const inCityPhrase =
    city === "Naberezhnye Chelny" ? "in Naberezhnye Chelny" : `in ${city}`;

  const defaultTitle = `${brandName} | Catering and buffet menus ${inCityPhrase}`;
  const defaultDesc = `Order catering, banquet dishes and buffet food for delivery ${inCityPhrase}. Delicious appetizers, bruschetta, canapes and ready-made party platters from ${brandName}.`;

  const rawTitle = seoSettings?.home_title?.trim();
  const rawDesc = seoSettings?.home_description?.trim();

  const title = rawTitle || defaultTitle;
  const description = rawDesc || defaultDesc;
  const ogImageUrl = toPublicMediaUrl(companyInfo?.ogImage || companyInfo?.heroImageTop);

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title,
      description,
      url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
      siteName: brandName,
      type: "website",
      images: ogImageUrl ? [{ url: ogImageUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : [],
    },
  };
}

export default async function Home() {
  const [jsonLd, sections, companyInfo, faq, footerNav, articles] = await Promise.all([
    getCachedJsonLd("/"),
    getCachedSections(),
    getCachedCompanyInfo(),
    getCachedFaq(),
    getCachedFooterNav(),
    getArticles(),
  ]);

  return (
    <>
      <JsonLd data={jsonLd} />
      <SectionsPage
        initialSections={sections}
        initialCompanyInfo={companyInfo}
        initialFaq={faq}
        initialFooterNav={footerNav}
        featuredArticle={articles && articles.length > 0 ? articles[0] : undefined}
      />
    </>
  );
}
