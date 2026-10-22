import { Metadata } from "next";
import { toPublicMediaUrl } from "@/utils/seo";
import {
  getCachedJsonLd,
  getCachedLegalDocument,
  getCachedCompanyInfo,
  getCachedFooterNav,
  getCachedSections,
} from "@/components/common/json-ld";
import { LegalDocumentPage } from "@/components/pages/legal-document-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [doc, companyInfo] = await Promise.all([
    getCachedLegalDocument("public-offer"),
    getCachedCompanyInfo(),
  ]);
  const ogImageUrl = toPublicMediaUrl(companyInfo?.ogImage || companyInfo?.heroImageTop);
  const title = doc?.title
    ? `${doc.title} | Chef Meal Catering`
    : "Public offer | Chef Meal Catering";
  const description =
    "Public offer for catering services and ready-made buffet food delivery from Chef Meal Catering in Naberezhnye Chelny.";

  return {
    title,
    description,
    alternates: {
      canonical: "/public-offer",
    },
    openGraph: {
      title,
      description,
      url: "http://localhost:3000/public-offer",
      images: ogImageUrl ? [ogImageUrl] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : [],
    },
  };
}

export default async function PublicOfferPage() {
  const [jsonLd, doc, companyInfo, footerNav, sections] = await Promise.all([
    getCachedJsonLd("/public-offer"),
    getCachedLegalDocument("public-offer"),
    getCachedCompanyInfo(),
    getCachedFooterNav(),
    getCachedSections(),
  ]);

  return (
    <LegalDocumentPage
      title={doc?.title || "Public offer"}
      contentHtml={doc?.content_html}
      jsonLdData={jsonLd}
      initialCompanyInfo={companyInfo}
      initialFooterNav={footerNav}
      initialSections={sections}
    />
  );
}
