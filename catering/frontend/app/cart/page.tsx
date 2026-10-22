import { Metadata } from 'next';
import SectionsPage from '@/components/pages/sections-page';
import {
  JsonLd,
  getCachedJsonLd,
  getCachedSections,
  getCachedCompanyInfo,
  getCachedFaq,
  getCachedFooterNav,
} from '@/components/common/json-ld';
import { getArticles } from '@/store/services/blogApi';
import { toPublicMediaUrl } from '@/utils/seo';

export const dynamic = "force-dynamic";

const cartTitle = 'Your cart — catering and buffets | Chef Meal Catering';
const cartDesc = 'Review your catering order and buffet platters in Naberezhnye Chelny. Choose delivery for your ready-made party food from Chef Meal Catering!';

export async function generateMetadata(): Promise<Metadata> {
  const companyInfo = await getCachedCompanyInfo();
  const ogImageUrl = toPublicMediaUrl(companyInfo?.ogImage || companyInfo?.heroImageTop);

  return {
    title: {
      absolute: cartTitle,
    },
    description: cartDesc,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: '/cart',
    },
    openGraph: {
      title: cartTitle,
      description: cartDesc,
      url: 'http://localhost:3000/cart',
      images: ogImageUrl ? [{ url: ogImageUrl }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: cartTitle,
      description: cartDesc,
      images: ogImageUrl ? [ogImageUrl] : [],
    },
  };
}

export default async function CartPage() {
  const [jsonLd, sections, companyInfo, faq, footerNav, articles] = await Promise.all([
    getCachedJsonLd("/cart"),
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
