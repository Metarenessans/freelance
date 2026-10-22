import { toPublicMediaUrl } from "@/utils/seo";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/pages/article-page";
import { getArticle } from "@/store/services/blogApi";
import {
  JsonLd,
  getCachedJsonLd,
  getCachedCompanyInfo,
  getCachedFooterNav,
} from "@/components/common/json-ld";

export const dynamic = "force-dynamic";

interface ArticleRouteProps {
  params: Promise<{
    slug: string;
  }>;
}

const BACKEND_URL =
  (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

export async function generateMetadata({
  params,
}: ArticleRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const [article, companyInfo] = await Promise.all([
    getArticle(slug),
    getCachedCompanyInfo(),
  ]);

  const brandName =
    companyInfo?.legalName ||
    companyInfo?.companyName ||
    "Chef Meal Catering";

  if (!article) {
    return {
      title: `Article not found | ${brandName}`,
    };
  }

  const textBlock = article.blocks?.find((b) => b.text);
  const defaultDesc = textBlock ? textBlock.text.substring(0, 160) : "";
  const rawTitle = (article.seo_title || article.title || "").trim();
  const fullTitle =
    rawTitle.includes(brandName) || rawTitle.length >= 48
      ? rawTitle
      : `${rawTitle} | ${brandName}`;

  const description = article.seo_description || defaultDesc;
  const coverUrl = toPublicMediaUrl(article.cover || companyInfo?.ogImage);

  return {
    title: {
      absolute: fullTitle,
    },
    description,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title: fullTitle,
      description,
      type: "article",
      url: `http://localhost:3000/blog/${slug}`,
      siteName: brandName,
      publishedTime: article.created_date,
      modifiedTime: article.updated_at || article.created_date,
      ...(coverUrl
        ? {
            images: [
              {
                url: coverUrl,
                alt: article.cover_alt || article.title,
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

export default async function ArticleRoute({ params }: ArticleRouteProps) {
  const { slug } = await params;
  const [article, companyInfo, footerNav, jsonLd] = await Promise.all([
    getArticle(slug),
    getCachedCompanyInfo(),
    getCachedFooterNav(),
    getCachedJsonLd(`/blog/${slug}`),
  ]);

  if (!article) {
    notFound();
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <ArticlePage
        article={article}
        initialCompanyInfo={companyInfo}
        initialFooterNav={footerNav}
      />
    </>
  );
}
