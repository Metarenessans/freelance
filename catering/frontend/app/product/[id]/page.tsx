import { Metadata } from 'next';
import SectionsPage from '@/components/pages/sections-page';
import { matchProductBySlug } from '@/utils/slugify';
import { buildProductFullTitle, buildProductDescription, getProductAltText, toPublicMediaUrl } from '@/utils/seo';
import {
  JsonLd,
  getCachedJsonLd,
  getCachedProducts,
  getCachedCategories,
  getCachedSections,
  getCachedCompanyInfo,
  getCachedFaq,
  getCachedFooterNav,
} from '@/components/common/json-ld';
import { getArticles } from '@/store/services/blogApi';

export const revalidate = 3600;

export async function generateStaticParams() {
  const products = await getCachedProducts();
  const params: { id: string }[] = [];
  const seen = new Set<string>();

  for (const product of products) {
    if (product.slug && !seen.has(product.slug)) {
      seen.add(product.slug);
      params.push({ id: product.slug });
    }
    const strId = String(product.id);
    if (strId && !seen.has(strId)) {
      seen.add(strId);
      params.push({ id: strId });
    }
  }

  return params;
}

import type { Product } from '@/store/services/catalogApi';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const [products, categories, companyInfo] = await Promise.all([
    getCachedProducts(),
    getCachedCategories(),
    getCachedCompanyInfo(),
  ]);
  const product =
    products.find((p) => p.slug === id || String(p.id) === id) ||
    matchProductBySlug(id, products);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  const productUrl = product?.slug ? `/product/${product.slug}` : `/product/${id}`;

  if (!product) {
    const fallbackTitle = 'Catering and buffet food catalog | Chef Meal Catering';
    const fallbackDesc =
      'Explore buffet platters and appetizers from Chef Meal Catering. Delicious ready-made party food with delivery in Naberezhnye Chelny!';
    return {
      title: {
        absolute: fallbackTitle,
      },
      description: fallbackDesc,
      alternates: {
        canonical: productUrl,
      },
      openGraph: {
        title: fallbackTitle,
        description: fallbackDesc,
        url: `${baseUrl}${productUrl}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: fallbackTitle,
        description: fallbackDesc,
      },
    };
  }

  const category = categories.find((c) => c.id === product.categoryId);
  const title = buildProductFullTitle(product.name, category?.name);
  const description = buildProductDescription({
    name: product.name,
    description: product.description,
    categoryName: category?.name,
    maxLen: 165,
  });

  const publicImageUrl = toPublicMediaUrl(product.imageUrl || companyInfo?.ogImage, baseUrl) || undefined;
  const imageAlt = getProductAltText(product);

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}${productUrl}`,
      images: publicImageUrl ? [{ url: publicImageUrl, alt: imageAlt }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: publicImageUrl ? [publicImageUrl] : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const [products, sections, jsonLd, companyInfo, faq, footerNav, articles] = await Promise.all([
    getCachedProducts(),
    getCachedSections(),
    getCachedJsonLd(`/product/${id}`),
    getCachedCompanyInfo(),
    getCachedFaq(),
    getCachedFooterNav(),
    getArticles(),
  ]);

  const product =
    products.find((p) => p.slug === id || String(p.id) === id) ||
    matchProductBySlug(id, products);

  return (
    <>
      <JsonLd data={jsonLd} />
      {product && (
        <article className="sr-only" aria-label={product.name}>
          <h2>{product.name}</h2>
          {product.description && <p>{product.description}</p>}
          <span>{product.priceInfo?.price} ₽</span>
        </article>
      )}
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
