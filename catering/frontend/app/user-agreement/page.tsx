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
    getCachedLegalDocument("user-agreement"),
    getCachedCompanyInfo(),
  ]);
  const ogImageUrl = toPublicMediaUrl(companyInfo?.ogImage || companyInfo?.heroImageTop);
  const title = doc?.title
    ? `${doc.title} | Chef Meal Catering`
    : "Terms of use | Chef Meal Catering";
  const description =
    "User agreement and terms of use for the Chef Meal Catering delivery service in Naberezhnye Chelny.";

  return {
    title,
    description,
    alternates: {
      canonical: "/user-agreement",
    },
    openGraph: {
      title,
      description,
      url: "http://localhost:3000/user-agreement",
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

export default async function UserAgreementPage() {
  const [jsonLd, doc, companyInfo, footerNav, sections] = await Promise.all([
    getCachedJsonLd("/user-agreement"),
    getCachedLegalDocument("user-agreement"),
    getCachedCompanyInfo(),
    getCachedFooterNav(),
    getCachedSections(),
  ]);

  return (
    <LegalDocumentPage
      title={doc?.title || "Terms of use"}
      contentHtml={doc?.content_html}
      jsonLdData={jsonLd}
      initialCompanyInfo={companyInfo}
      initialFooterNav={footerNav}
      initialSections={sections}
    />
  );
}
