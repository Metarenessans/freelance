export interface SeoSettingsData {
  home_title?: string;
  home_description?: string;
  blog_title?: string;
  blog_description?: string;
  updated_at?: string;
}

import { toPublicMediaUrl } from "@/utils/seo";
export interface CalculateFeatureItem {
  id?: number;
  icon: string;
  title: string;
  subtitle: string;
  order?: number;
}

export interface CalculateStepItem {
  id?: number;
  step: string;
  title: string;
  text: string;
  order?: number;
}

export interface CalculateFaqItem {
  id?: number;
  question: string;
  answer: string;
  order?: number;
}

export interface CalculatePageConfig {
  hero_badge: string;
  hero_title: string;
  hero_description: string;
  features: CalculateFeatureItem[];
  budget_options: string[];
  food_options: string[];
  additional_services: any[];
  steps_title: string;
  steps_subtitle: string;
  steps: CalculateStepItem[];
  faq_title: string;
  faq_subtitle: string;
  faqs: CalculateFaqItem[];
  seo_title?: string;
  seo_description?: string;
  updated_at?: string;
}

import type { Section, Category, Product } from "@/store/services/catalogApi";
import type { CompanyInfo, FooterNavItem, PrivacyPolicyData, LegalDocument } from "@/store/services/companyApi";
import type { FaqItem } from "@/store/services/faqApi";

interface CatalogDataCache {
  sections?: Section[];
  categories?: Category[];
  products?: Product[];
  companyInfo?: CompanyInfo;
  faq?: FaqItem[];
  footerNav?: FooterNavItem[];
  privacyPolicy?: PrivacyPolicyData;
  legalDocuments?: Record<string, LegalDocument>;
  calculateConfig?: CalculatePageConfig;
  seoSettings?: SeoSettingsData;
}

// Global in-memory cache on the Next.js server instance
const globalForCatalogCache = globalThis as unknown as {
  catalogDataCache?: CatalogDataCache;
};

if (!globalForCatalogCache.catalogDataCache) {
  globalForCatalogCache.catalogDataCache = {};
}
const dataCache = globalForCatalogCache.catalogDataCache;

/**
 * Read catalog sections from the server memory cache.
 * Load from the Django API on a cache miss.
 */

const API_SSR_HEADERS: HeadersInit = {
};

function getApiUrl(): string {
  if (typeof window === "undefined") {
    return (process.env.INTERNAL_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
  }
  return (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
}

export async function getCachedSections(): Promise<Section[]> {
  if (dataCache.sections && dataCache.sections.length > 0) {
    return dataCache.sections;
  }
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/api/v1/catalog/sections/`, {
      cache: "no-store",
      headers: API_SSR_HEADERS,
    });
    if (res.ok) {
      const raw: Section[] = await res.json();
      dataCache.sections = raw.map((s) => {
        const normalized = toPublicMediaUrl(s.imageUrl || (s as any).image_url || (s as any).image);
        const item: any = {
          ...s,
          imageUrl: normalized,
          seoTitle: s.seoTitle || (s as any).seo_title || "",
          seoDescription: s.seoDescription || (s as any).seo_description || "",
          seo_title: s.seo_title || (s as any).seoTitle || "",
          seo_description: s.seo_description || (s as any).seoDescription || "",
        };
        if (item.image) {
          item.image = normalized;
        }
        if (item.image_url) {
          item.image_url = normalized;
        }
        return item as Section;
      });
      return dataCache.sections!;
    }
  } catch (e) {
    console.error("Failed to fetch sections:", e);
  }
  return [];
}

/**
 * Read catalog categories from the server memory cache.
 */
export async function getCachedCategories(): Promise<Category[]> {
  if (dataCache.categories && dataCache.categories.length > 0) {
    return dataCache.categories;
  }
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/api/v1/catalog/categories/`, {
      cache: "no-store",
      headers: API_SSR_HEADERS,
    });
    if (res.ok) {
      dataCache.categories = await res.json();
      return dataCache.categories!;
    }
  } catch (e) {
    console.error("Failed to fetch categories:", e);
  }
  return [];
}

/**
 * Read all products from the server memory cache.
 */
export async function getCachedProducts(): Promise<Product[]> {
  if (dataCache.products && dataCache.products.length > 0) {
    return dataCache.products;
  }
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/api/v1/catalog/products/`, {
      cache: "no-store",
      headers: API_SSR_HEADERS,
    });
    if (res.ok) {
      const raw: Product[] = await res.json();
      dataCache.products = raw.map((p) => {
        const normalized = toPublicMediaUrl(p.imageUrl || (p as any).image_url || (p as any).image);
        const item: any = {
          ...p,
          imageUrl: normalized,
        };
        if (item.image) {
          item.image = normalized;
        }
        if (item.image_url) {
          item.image_url = normalized;
        }
        return item as Product;
      });
      return dataCache.products!;
    }
  } catch (e) {
    console.error("Failed to fetch products:", e);
  }
  return [];
}

/**
 * Read company information from the server memory cache.
 */
export async function getCachedCompanyInfo(): Promise<CompanyInfo | undefined> {
  if (dataCache.companyInfo) {
    return dataCache.companyInfo;
  }
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/api/v1/company/`, {
      cache: "no-store",
      headers: API_SSR_HEADERS,
    });
    if (res.ok) {
      const data = await res.json();
      const cuisines = data.serves_cuisine
        ? data.serves_cuisine
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];
      let effectiveCuisines: string[] = cuisines;
      if (effectiveCuisines.length === 0) {
        // Derive cuisine categories from the current catalog rather than hard-coding them.
        const sections = await getCachedSections();
        effectiveCuisines = sections
          .map((s: Section) => s.name)
          .filter(Boolean);
      }

      dataCache.companyInfo = {
        companyName: data.company_name,
        legalName: data.legal_name,
        city: data.city,
        address: data.address,
        latitude: data.latitude ? parseFloat(data.latitude) : undefined,
        longitude: data.longitude ? parseFloat(data.longitude) : undefined,
        priceRange: data.price_range || "₽₽",
        servesCuisine: effectiveCuisines,
        inn: data.inn,
        ogrn: data.ogrn,
        phoneNumber: data.phone_number,
        email: data.email,
        telegram: data.telegram,
        maxMessenger: data.max_messenger,
        max: data.max_messenger,
        vkGroup: data.vk_group,
        vk: data.vk,
        reviewsUrl: data.reviews_url,
        rknRegistryUrl: data.rkn_registry_url,
        rknRegistryNumber: data.rkn_registry_number,
        workingHours: data.working_hours,
        postalCode: data.postal_code,
        country: data.country,
        minOrderAmount: parseFloat(data.min_order_amount) || 5000,
        freeDeliveryThreshold: parseFloat(data.free_delivery_threshold) || 10000,
        deliveryCost: parseFloat(data.delivery_cost) || 1500,
        heroImageTop: toPublicMediaUrl(data.hero_image_top),
        heroImageTopMobile: toPublicMediaUrl(data.hero_image_top_mobile),
        heroImageBottom: toPublicMediaUrl(data.hero_image_bottom),
        ogImage: toPublicMediaUrl(data.og_image),
      };
      return dataCache.companyInfo;
    }
  } catch (e) {
    console.error("Failed to fetch company info:", e);
  }
  return undefined;
}

/**
 * Read frequently asked questions from the server memory cache.
 */
export async function getCachedFaq(): Promise<FaqItem[]> {
  if (dataCache.faq && dataCache.faq.length > 0) {
    return dataCache.faq;
  }
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/api/v1/faq/`, {
      cache: "no-store",
      headers: API_SSR_HEADERS,
    });
    if (res.ok) {
      dataCache.faq = await res.json();
      return dataCache.faq!;
    }
  } catch (e) {
    console.error("Failed to fetch faq:", e);
  }
  return [];
}

/**
 * Read footer navigation from the server memory cache.
 */
export async function getCachedFooterNav(): Promise<FooterNavItem[]> {
  if (dataCache.footerNav && dataCache.footerNav.length > 0) {
    return dataCache.footerNav;
  }
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/api/v1/company/footer/`, {
      cache: "no-store",
      headers: API_SSR_HEADERS,
    });
    if (res.ok) {
      dataCache.footerNav = await res.json();
      return dataCache.footerNav!;
    }
  } catch (e) {
    console.error("Failed to fetch footer nav:", e);
  }
  return [];
}

/**
 * Read a legal document by slug from the server memory cache.
 */
export async function getCachedLegalDocument(slug: string): Promise<LegalDocument | undefined> {
  if (!dataCache.legalDocuments) {
    dataCache.legalDocuments = {};
  }
  if (dataCache.legalDocuments[slug]) {
    return dataCache.legalDocuments[slug];
  }
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/api/v1/company/documents/${slug}/`, {
      cache: "no-store",
      headers: API_SSR_HEADERS,
    });
    if (res.ok) {
      const doc: LegalDocument = await res.json();
      dataCache.legalDocuments[slug] = doc;
      if (slug === "privacy-policy") {
        dataCache.privacyPolicy = doc;
      }
      return doc;
    }
  } catch (e) {
    console.error(`Failed to fetch legal document (${slug}):`, e);
  }
  return undefined;
}

/**
 * Read the privacy policy from the server memory cache.
 */
export async function getCachedPrivacyPolicy(): Promise<PrivacyPolicyData | undefined> {
  return getCachedLegalDocument("privacy-policy");
}

/**
 * Read menu planner settings from the server memory cache.
 */
export async function getCachedCalculateConfig(): Promise<CalculatePageConfig> {
  if (dataCache.calculateConfig) {
    return dataCache.calculateConfig;
  }
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/api/v1/menu-requests/calculate-settings/`, {
      cache: "no-store",
      headers: API_SSR_HEADERS,
    });
    if (res.ok) {
      dataCache.calculateConfig = await res.json();
      return dataCache.calculateConfig!;
    }
  } catch (e) {
    console.error("Failed to fetch calculate settings:", e);
  }
  return {
    hero_badge: "⚡ Free estimate in 15 minutes",
    hero_title: "Plan your catering or banquet menu in Naberezhnye Chelny",
    hero_description: "Tell us your event type, guest count and preferences. We will prepare a free personalized menu and estimate to suit your budget.",
    features: [
      { id: 1, icon: "⏱️", title: "Estimate in 15 minutes", subtitle: "Quick estimate via WhatsApp or Telegram", order: 1 },
      { id: 2, icon: "💰", title: "Completely free", subtitle: "No obligation to order", order: 2 },
      { id: 3, icon: "🍽️", title: "Options for every budget", subtitle: "From a light buffet to a lavish banquet", order: 3 },
    ],
    budget_options: [
      "Not sure - please advise",
      "Under 15,000 ₽",
      "15 000 - 30 000 ₽",
      "30 000 - 50 000 ₽",
      "50 000 - 100 000 ₽",
      "Over 100,000 ₽",
    ],
    food_options: [
      "Appetizers",
      "Hot dishes",
      "Salads",
      "Desserts",
    ],
    additional_services: [],
    steps_title: "How it works",
    steps_subtitle: "A clear, straightforward way to plan food for your celebration",
    steps: [
      { id: 1, step: "01", title: "Tell us about your event", text: "Enter your guest count, event type and date in the form above. It takes less than a minute.", order: 1 },
      { id: 2, step: "02", title: "Estimate in 15 minutes", text: "We will prepare two or three free menu options within your budget and send them to your preferred messenger.", order: 2 },
      { id: 3, step: "03", title: "Confirm the details and deposit", text: "We tailor the menu and services to your needs. A 30% deposit reserves your date.", order: 3 },
      { id: 4, step: "04", title: "Delivery and payment", text: "We deliver your food at the agreed date and time. Pay the balance on delivery.", order: 4 },
    ],
    faq_title: "Menu planning FAQ",
    faq_subtitle: "Answers to common questions about dishes, timing and presentation",
    faqs: [],
  };
}

/**
 * Read the singleton SEO settings from the server memory cache.
 */
export async function getCachedSeoSettings(): Promise<SeoSettingsData | undefined> {
  if (dataCache.seoSettings) {
    return dataCache.seoSettings;
  }
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/api/v1/seo-settings/`, {
      cache: "no-store",
      headers: API_SSR_HEADERS,
    });
    if (res.ok) {
      dataCache.seoSettings = await res.json();
      return dataCache.seoSettings;
    }
  } catch (e) {
    console.error("Failed to fetch SEO settings:", e);
  }
  return undefined;
}

/**
 * Clear the in-memory catalog reference data.
 */
export function invalidateCatalogDataCache(filter?: {
  type?: string;
  slug?: string;
}) {
  if (
    !filter ||
    !filter.type ||
    filter.type === "all"
  ) {
    dataCache.sections = undefined;
    dataCache.categories = undefined;
    dataCache.products = undefined;
    dataCache.companyInfo = undefined;
    dataCache.faq = undefined;
    dataCache.footerNav = undefined;
    dataCache.privacyPolicy = undefined;
    dataCache.legalDocuments = undefined;
    dataCache.calculateConfig = undefined;
    dataCache.seoSettings = undefined;
    return;
  }

  if (filter.type === "company" || filter.type === "privacy" || filter.type === "legal_document") {
    dataCache.companyInfo = undefined;
    dataCache.footerNav = undefined;
    dataCache.privacyPolicy = undefined;
    dataCache.legalDocuments = undefined;
    dataCache.calculateConfig = undefined;
    dataCache.seoSettings = undefined;
    return;
  }

  if (filter.type === "faq") {
    dataCache.faq = undefined;
    return;
  }

  if (filter.type === "product") {
    dataCache.products = undefined;
    return;
  }

  if (filter.type === "section") {
    dataCache.sections = undefined;
    return;
  }

  if (filter.type === "category") {
    dataCache.categories = undefined;
    return;
  }

  if (filter.type === "seo") {
    dataCache.seoSettings = undefined;
    return;
  }

  if (filter.type === "calculate") {
    dataCache.calculateConfig = undefined;
    dataCache.seoSettings = undefined;
    return;
  }
}



/**
 * Check the system setting controlling debug schema output.
 */
export async function isDebugJsonFileEnabled(): Promise<boolean> {
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/api/v1/system-settings/`, {
      cache: "no-store",
      headers: API_SSR_HEADERS,
    });
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.enable_debug_json_file);
    }
  } catch (err) {
    // Disable debug output by default if the request fails.
  }
  return false;
}
