import { Metadata } from 'next';
import { toPublicMediaUrl } from '@/utils/seo';
import { CalculatePage } from '@/components/pages/calculate-page/calculate-page';
import {
  getCachedJsonLd,
  getCachedCalculateConfig,
  getCachedCompanyInfo,
  getCachedFooterNav,
  getCachedSections,
} from '@/components/common/json-ld';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const [config, companyInfo] = await Promise.all([
    getCachedCalculateConfig(),
    getCachedCompanyInfo(),
  ]);
  const title =
    config.seo_title ||
    'Online catering and buffet menu estimate | Chef Meal Catering';
  const description =
    config.seo_description ||
    'Get a free catering estimate for your event, guest count and budget in Naberezhnye Chelny. A personalized banquet or buffet menu in 15 minutes!';
  const ogImageUrl = toPublicMediaUrl(companyInfo?.ogImage || companyInfo?.heroImageTop);

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: '/calculate',
    },
    openGraph: {
      title,
      description,
      url: 'http://localhost:3000/calculate',
      images: ogImageUrl ? [ogImageUrl] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : [],
    },
  };
}

export default async function Page() {
  const [config, jsonLd, companyInfo, footerNav, sections] = await Promise.all([
    getCachedCalculateConfig(),
    getCachedJsonLd("/calculate"),
    getCachedCompanyInfo(),
    getCachedFooterNav(),
    getCachedSections(),
  ]);

  return (
    <CalculatePage
      config={config}
      jsonLdData={jsonLd}
      initialCompanyInfo={companyInfo}
      initialFooterNav={footerNav}
      initialSections={sections}
    />
  );
}
