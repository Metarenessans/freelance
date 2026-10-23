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

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const [doc, companyInfo] = await Promise.all([
    getCachedLegalDocument("privacy-policy"),
    getCachedCompanyInfo(),
  ]);
  const ogImageUrl = toPublicMediaUrl(companyInfo?.ogImage || companyInfo?.heroImageTop);
  const title = doc?.title
    ? `${doc.title} | Chef Meal Catering`
    : "Privacy policy | Chef Meal Catering";
  const description =
    "How Chef Meal Catering processes and protects personal data for its catering delivery service in Naberezhnye Chelny.";

  return {
    title,
    description,
    alternates: {
      canonical: "/privacy-policy",
    },
    openGraph: {
      title,
      description,
      url: "http://localhost:3000/privacy-policy",
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

export default async function PrivacyPolicyPage() {
  const [jsonLd, doc, companyInfo, footerNav, sections] = await Promise.all([
    getCachedJsonLd("/privacy-policy"),
    getCachedLegalDocument("privacy-policy"),
    getCachedCompanyInfo(),
    getCachedFooterNav(),
    getCachedSections(),
  ]);

  return (
    <LegalDocumentPage
      title={doc?.title || "Privacy policy"}
      contentHtml={doc?.content_html}
      jsonLdData={jsonLd}
      initialCompanyInfo={companyInfo}
      initialFooterNav={footerNav}
      initialSections={sections}
    />
  );
}
