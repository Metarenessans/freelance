import React from "react";
import { BASE_URL, ENABLE_DEBUG_JSON_FILE } from "./json-ld-config";
import type { Section } from "@/store/services/catalogApi";
import type { SimpleBlogArticle, BlogArticle } from "@/store/services/blogApi";

export { BASE_URL, ENABLE_DEBUG_JSON_FILE };

/**
 * Normalize a phone number to international format with a leading plus.
 */
export const formatPhoneWithPlus = (phone: string | undefined): string => {
  if (!phone) return "";
  const trimmed = phone.trim();
  return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
};

/**
 * Remove redundant @context when nesting a node in @graph.
 */
const stripContext = (item: Record<string, any>): Record<string, any> => {
  if (!item || typeof item !== "object") return item;
  const { "@context": _ctx, ...rest } = item;
  return rest;
};

/**
 * Combine a schema dictionary or array into one Schema.org @graph.
 */
export const buildGraphJsonLd = (
  schemas: Record<string, any> | Array<Record<string, any>>
) => {
  const list = Array.isArray(schemas) ? schemas : Object.values(schemas);
  const filtered = list.filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@graph": filtered.map(stripContext),
  };
};

/**
 * Write generated JSON-LD to a local debug file when enabled.
 */
export const writeDebugJsonLd = async (jsonLd: Record<string, any>) => {
  if (typeof window === "undefined") {
    try {
      const { isDebugJsonFileEnabled } = await import("./server-catalog-cache");
      const enabled = await isDebugJsonFileEnabled();
      if (!enabled) return;

      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(process.cwd(), "schema_markup_debug.json");
      fs.writeFileSync(filePath, JSON.stringify(jsonLd, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write schema_markup_debug.json:", e);
    }
  }
};




/**
 * Load current company information from the Django API.
 */
export async function fetchCompanyInfo(): Promise<CompanyInfoJsonLdParams | undefined> {
  try {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
    const res = await fetch(`${apiUrl}/api/v1/company/`, {
      cache: "no-store",
    });
    if (!res.ok) return undefined;
    const data = await res.json();
    const cuisines = data.serves_cuisine
      ? data.serves_cuisine
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];
    let effectiveCuisines = cuisines;
    if (effectiveCuisines.length === 0) {
      try {
        const secRes = await fetch(`${apiUrl}/api/v1/catalog/sections/`, {
          cache: "no-store",
        });
        if (secRes.ok) {
          const sections: Section[] = await secRes.json();
          effectiveCuisines = sections.map((s: Section) => s.name).filter(Boolean);
        }
      } catch {
        // ignore
      }
    }
    return {
      companyName: data.company_name,
      legalName: data.legal_name,
      city: data.city,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      priceRange: data.price_range || "₽₽",
      servesCuisine: effectiveCuisines.length > 0 ? effectiveCuisines : undefined,
      inn: data.inn,
      ogrn: data.ogrn,
      phoneNumber: data.phone_number,
      email: data.email,
      telegram: data.telegram,
      maxMessenger: data.max_messenger,
      socialLinks: [data.telegram, data.max_messenger, data.vk].filter(Boolean),
    };
  } catch {
    return undefined;
  }
}

export interface CompanyInfoJsonLdParams {
  companyName?: string;
  legalName?: string;
  city?: string;
  address?: string;
  latitude?: number | string;
  longitude?: number | string;
  inn?: string;
  ogrn?: string;
  phoneNumber?: string;
  email?: string;
  telegram?: string;
  maxMessenger?: string;
  logoUrl?: string;
  socialLinks?: string[];
  priceRange?: string;
  servesCuisine?: string | string[];
  type?: string | string[];
}

export interface OrganizationJsonLdParams extends CompanyInfoJsonLdParams {
  baseUrl?: string;
}

/**
 * 1. Schema.org FoodEstablishment generator for the catering business.
 */
export const buildOrganizationJsonLd = (
  paramsOrBaseUrl: string | OrganizationJsonLdParams = BASE_URL
) => {
  const params: OrganizationJsonLdParams =
    typeof paramsOrBaseUrl === "string"
      ? { baseUrl: paramsOrBaseUrl }
      : paramsOrBaseUrl;

  const baseUrl = params.baseUrl || BASE_URL;

  const orgSchema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": params.type || "FoodEstablishment",
    "@id": `${baseUrl}/#organization`,
    url: baseUrl,
  };

  if (params.companyName) {
    orgSchema.name = params.companyName;
  }

  if (params.legalName || params.companyName) {
    orgSchema.legalName = params.legalName || params.companyName;
  }

  if (params.logoUrl) {
    orgSchema.logo = {
      "@type": "ImageObject",
      url: params.logoUrl,
    };
    orgSchema.image = params.logoUrl;
  }

  if (params.phoneNumber) {
    const telephone = formatPhoneWithPlus(params.phoneNumber);
    orgSchema.telephone = telephone;
    orgSchema.contactPoint = [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone,
        availableLanguage: ["ru"],
      },
    ];
  }

  if (params.inn) {
    orgSchema.taxID = params.inn;
  }

  if (params.ogrn) {
    orgSchema.identifier = params.ogrn;
  }

  const socials = (
    params.socialLinks || [params.telegram, params.maxMessenger]
  ).filter(Boolean) as string[];

  if (socials.length > 0) {
    orgSchema.sameAs = socials;
  }

  if (params.address) {
    orgSchema.address = {
      "@type": "PostalAddress",
      ...(params.city ? { addressLocality: params.city } : {}),
      addressCountry: "RU",
      streetAddress: params.address,
    };
  }

  if (
    params.latitude !== undefined &&
    params.latitude !== null &&
    params.longitude !== undefined &&
    params.longitude !== null
  ) {
    const lat = Number(params.latitude);
    const lon = Number(params.longitude);
    if (!isNaN(lat) && !isNaN(lon)) {
      orgSchema.geo = {
        "@type": "GeoCoordinates",
        latitude: lat,
        longitude: lon,
      };
    }
  }

  if (params.priceRange) {
    orgSchema.priceRange = params.priceRange;
  }

  if (params.servesCuisine && params.servesCuisine.length > 0) {
    orgSchema.servesCuisine = Array.isArray(params.servesCuisine)
      ? params.servesCuisine
      : params.servesCuisine
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
  }

  if (params.email) {
    orgSchema.email = params.email;
  }

  return orgSchema;
};


export interface WebSiteJsonLdParams {
  baseUrl?: string;
  name?: string;
  inLanguage?: string;
}

/**
 * Schema.org WebSite generator.
 */
export const buildWebSiteJsonLd = (
  baseUrlOrParams: string | WebSiteJsonLdParams = BASE_URL
) => {
  const options =
    typeof baseUrlOrParams === "string"
      ? { baseUrl: baseUrlOrParams }
      : baseUrlOrParams;
  const baseUrl = options.baseUrl ?? BASE_URL;
  const name = options.name ?? "Chef Meal Catering";
  const inLanguage = options.inLanguage ?? "en-US";

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name,
    inLanguage,
    publisher: {
      "@id": `${baseUrl}/#organization`,
    },
  };
};


export interface WebPageJsonLdParams {
  pageUrl: string;
  title: string;
  description?: string;
  baseUrl?: string;
  breadcrumbId?: string;
  mainEntityId?: string;
}

/**
 * 3. Schema.org WebPage generator.
 */
export const buildWebPageJsonLd = ({
  pageUrl,
  title,
  description,
  baseUrl = BASE_URL,
  breadcrumbId,
  mainEntityId,
}: WebPageJsonLdParams) => {
  const webPageId =
    pageUrl === baseUrl || pageUrl.endsWith("/")
      ? `${pageUrl.replace(/\/$/, "")}/#webpage`
      : `${pageUrl}#webpage`;

  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": webPageId,
    url: pageUrl,
    name: title,
    ...(description ? { description } : {}),
    isPartOf: {
      "@id": `${baseUrl}/#website`,
    },
  };

  if (mainEntityId) {
    schema["mainEntity"] = {
      "@id": mainEntityId,
    };
  }

  if (breadcrumbId) {
    schema["breadcrumb"] = {
      "@id": breadcrumbId,
    };
  }

  return schema;
};

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * 4. Schema.org BreadcrumbList generator.
 */
export const buildBreadcrumbsJsonLd = (
  items: BreadcrumbItem[],
  pageUrl?: string,
  baseUrl = BASE_URL
) => {
  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  if (pageUrl) {
    const breadcrumbId =
      pageUrl === baseUrl || pageUrl.endsWith("/")
        ? `${pageUrl.replace(/\/$/, "")}/#breadcrumb`
        : `${pageUrl}#breadcrumb`;
    schema["@id"] = breadcrumbId;
  }

  return schema;
};

export interface ProductItem {
  id?: string | number;
  name: string;
  imageUrl?: string;
  description?: string;
  priceInfo?: { price: number; oldPrice?: number };
  price?: number | string;
  categoryId?: string;
  extraInfo?: Array<{ amount: number; unit: string }>;
  slug?: string;
}

export interface ProductJsonLdParams {
  product: ProductItem;
  url?: string;
  baseUrl?: string;
  brandName?: string;
}

export interface ProductSchemasResult {
  productSchema: Record<string, any>;
  offerSchema: Record<string, any>;
}

/**
 * 5. Product and Offer schemas for a catering dish or platter.
 */
export const buildProductSchemas = ({
  product,
  url,
  baseUrl = BASE_URL,
  brandName = "Chef Meal Catering",
}: ProductJsonLdParams): ProductSchemasResult => {
  const price =
    product.priceInfo?.price ??
    (typeof product.price === "string"
      ? parseFloat(product.price)
      : product.price ?? 0);

  const productUrl =
    url ||
    `${baseUrl}/product/${product.slug || ""}`;

  const image = product.imageUrl
    ? product.imageUrl.startsWith("http")
      ? product.imageUrl
      : `${baseUrl}${product.imageUrl.startsWith("/") ? "" : "/"}${product.imageUrl}`
    : undefined;

  const productId = product.id !== undefined ? String(product.id) : undefined;
  const productSchemaId = `${productUrl}#product`;
  const offerSchemaId = `${productUrl}#offer`;

  const extraText = (product.extraInfo || [])
    .map((e) => `${e.amount} ${e.unit}`)
    .join(", ");
  const description =
    [product.description, extraText ? `(${extraText})` : ""]
      .filter(Boolean)
      .join(" ") || product.name;

  const productSchema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": productSchemaId,
    name: product.name,
    ...(productId ? { sku: productId } : {}),
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    ...(image
      ? {
        image: {
          "@type": "ImageObject",
          url: image,
          name: product.name,
          caption: `${product.name} — catering Chef Meal Catering`,
        },
      }
      : {}),
    description,
    offers: {
      "@id": offerSchemaId,
    },
  };

  const oneYearAhead = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const offerSchema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Offer",
    "@id": offerSchemaId,
    url: productUrl,
    priceCurrency: "RUB",
    price: price,
    priceValidUntil: oneYearAhead,
    itemCondition: "https://schema.org/NewCondition",
    availability: "https://schema.org/InStock",
    seller: {
      "@id": `${baseUrl}/#organization`,
    },
  };

  return { productSchema, offerSchema };
};

/**
 * Single Product schema with a nested Offer for backward compatibility.
 */
export const buildProductJsonLd = (params: ProductJsonLdParams) => {
  const { productSchema, offerSchema } = buildProductSchemas(params);
  return {
    ...productSchema,
    offers: offerSchema,
  };
};

/**
 * Schema.org ItemList for a catalog product list.
 */
export const buildItemListJsonLd = (
  products: ProductItem[],
  pageUrl: string,
  baseUrl = BASE_URL
) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  "@id": `${pageUrl}#itemlist`,
  itemListOrder: "https://schema.org/ItemListOrderAscending",
  numberOfItems: products.length,
  itemListElement: products.map((prod, index) => {
    const prodUrl = `${baseUrl}/product/${prod.slug || ""}`;
    return {
      "@type": "ListItem",
      position: index + 1,
      name: prod.name,
      item: {
        "@id": `${prodUrl}#product`,
      },
    };
  }),
});


export interface CollectionJsonLdParams {
  name: string;
  description: string;
  url?: string;
  items?: Array<{ name: string; url: string }>;
  baseUrl?: string;
  mainEntityId?: string;
}

/**
 * 6. Schema.org CollectionPage for a catalog section.
 */
export const buildCollectionJsonLd = ({
  name,
  description,
  url,
  items = [],
  baseUrl = BASE_URL,
  mainEntityId,
}: CollectionJsonLdParams) => {
  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    url,
    name,
    description,
    isPartOf: {
      "@id": `${baseUrl}/#website`,
    },
    breadcrumb: {
      "@id": `${url}#breadcrumb`,
    },
  };

  if (mainEntityId) {
    schema.mainEntity = {
      "@id": mainEntityId,
    };
  } else if (items.length > 0) {
    schema.mainEntity = {
      "@type": "ItemList",
      "@id": `${url}#itemlist`,
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: item.url,
      })),
    };
  }

  return schema;
};

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * 7. Schema.org FAQPage generator.
 */
export const buildFaqJsonLd = (faqs: FaqItem[], pageUrl = BASE_URL) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${pageUrl}#faq`,
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
});

/**
 * Infer an image MIME type from its URL.
 */
export const getImgEncodingFormat = (url: string): string => {
  const clean = url.split("?")[0].split("#")[0];
  const ext = clean.split(".").pop()?.toLowerCase();
  if (ext === "webp") return "image/webp";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "gif") return "image/gif";
  if (ext === "svg") return "image/svg+xml";
  return "image/jpeg";
};

export interface BlogListingJsonLdParams {
  articles: readonly SimpleBlogArticle[] | SimpleBlogArticle[];
  pageUrl: string;
  baseUrl?: string;
  title?: string;
  description?: string;
}

/**
 * 8. Schemas for the blog listing at /blog.
 * Include CollectionPage, BreadcrumbList, ItemList and article image nodes.
 */
export const buildBlogListingSchemas = ({
  articles,
  pageUrl,
  baseUrl = BASE_URL,
  title = "Catering blog — articles and tips | Chef Meal Catering",
  description = "Practical chef tips on buffet portions, table settings, party food boxes and off-site events in Naberezhnye Chelny.",
}: BlogListingJsonLdParams): Record<string, any> => {
  const schemas: Record<string, any> = {};

  // Breadcrumbs: Home, Blog.
  schemas.breadcrumb = buildBreadcrumbsJsonLd(
    [
      { name: "Home", url: baseUrl },
      { name: "Blog", url: pageUrl },
    ],
    pageUrl
  );

  // CollectionPage for the blog listing.
  schemas.collection = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${pageUrl}#collection`,
    url: pageUrl,
    name: title,
    description: description,
    isPartOf: {
      "@id": `${baseUrl}/#website`,
    },
    mainEntity: {
      "@id": `${pageUrl}#itemlist`,
    },
    breadcrumb: {
      "@id": `${pageUrl}#breadcrumb`,
    },
  };

  // ItemList with newest articles first.
  schemas.itemlist = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${pageUrl}#itemlist`,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: articles.length,
    itemListElement: articles.map((article, index) => {
      const articleSlug = article.slug || article.id;
      const articleUrl = `${baseUrl}/blog/${articleSlug}`;
      return {
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@id": `${articleUrl}#article`,
        },
      };
    }),
  };

  // BlogPosting and ImageObject for each article.
  articles.forEach((article) => {
    const articleSlug = article.slug || article.id;
    const articleUrl = `${baseUrl}/blog/${articleSlug}`;
    const coverUrl = article.cover
      ? article.cover.startsWith("http")
        ? article.cover
        : `${baseUrl}${article.cover.startsWith("/") ? "" : "/"}${article.cover}`
      : `${baseUrl}/logo.png`;

    const desc = article.seo_description || article.title;
    const dateString = article.created_date ? article.created_date.substring(0, 10) : "";

    schemas[`blogposting-${articleSlug}`] = {
      "@context": "https://schema.org",
      "@type": ["Article", "BlogPosting"],
      "@id": `${articleUrl}#article`,
      url: articleUrl,
      headline: article.title,
      name: article.title,
      description: desc,
      image: {
        "@id": `${coverUrl}#image`,
      },
      datePublished: dateString,
      author: {
        "@id": `${baseUrl}/#organization`,
      },
      publisher: {
        "@id": `${baseUrl}/#organization`,
      },
      inLanguage: "en-US",
      citation: [
        "https://docs.cntd.ru/document/566276706",
        "https://docs.cntd.ru/document/1200107325"
      ],
    };

    schemas[`article-image-${articleSlug}`] = {
      "@context": "https://schema.org",
      "@type": "ImageObject",
      "@id": `${coverUrl}#image`,
      contentUrl: coverUrl,
      name: article.cover_alt || article.title,
      caption: article.cover_alt || article.title,
      description: desc,
      encodingFormat: getImgEncodingFormat(coverUrl),
    };
  });

  return schemas;
};

export interface ArticleDetailJsonLdParams {
  article: BlogArticle;
  pageUrl: string;
  baseUrl?: string;
  brandName?: string;
  faqs?: FaqItem[];
}

/**
 * 9. Schemas for a blog article at /blog/[slug].
 * Include WebPage, BreadcrumbList, BlogPosting and ImageObject.
 */
export const buildArticleDetailSchemas = ({
  article,
  pageUrl,
  baseUrl = BASE_URL,
  brandName = "Chef Meal Catering",
  faqs,
}: ArticleDetailJsonLdParams): Record<string, any> => {
  const schemas: Record<string, any> = {};

  const coverUrl = article.cover
    ? article.cover.startsWith("http")
      ? article.cover
      : `${baseUrl}${article.cover.startsWith("/") ? "" : "/"}${article.cover}`
    : `${baseUrl}/logo.png`;

  const textBlock = article.blocks?.find((b) => b.text);
  const defaultDesc = textBlock ? textBlock.text.substring(0, 160) : "";
  const desc = article.seo_description || defaultDesc || article.title;
  const dateString = article.created_date ? article.created_date.substring(0, 10) : "";
  const dateModified = article.updated_at
    ? article.updated_at.substring(0, 10)
    : dateString;

  const textBlocks =
    article.blocks
      ?.filter((b) => b.text)
      .map((b) => b.text)
      .join(" ") || "";
  const wordCount = textBlocks.split(/\s+/).filter(Boolean).length;

  const title = article.seo_title || `${article.title} | ${brandName}`;

  // Breadcrumbs: Home, Blog, Article.
  schemas.breadcrumb = buildBreadcrumbsJsonLd(
    [
      { name: "Home", url: baseUrl },
      { name: "Blog", url: `${baseUrl}/blog` },
      { name: article.title || "Article", url: pageUrl },
    ],
    pageUrl
  );

  // WebPage
  schemas.webpage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: title,
    description: desc,
    isPartOf: {
      "@id": `${baseUrl}/#website`,
    },
    mainEntity: {
      "@id": `${pageUrl}#article`,
    },
    breadcrumb: {
      "@id": `${pageUrl}#breadcrumb`,
    },
  };

  // BlogPosting
  schemas.blogposting = {
    "@context": "https://schema.org",
    "@type": ["Article", "BlogPosting"],
    "@id": `${pageUrl}#article`,
    url: pageUrl,
    headline: article.title,
    name: article.title,
    description: desc,
    image: {
      "@id": `${coverUrl}#image`,
    },
    mainEntityOfPage: {
      "@id": `${pageUrl}#webpage`,
    },
    author: {
      "@id": `${baseUrl}/#organization`,
    },
    publisher: {
      "@id": `${baseUrl}/#organization`,
    },
    datePublished: dateString,
    ...(dateModified ? { dateModified } : {}),
    wordCount: wordCount,
    inLanguage: "en-US",
    citation: [
      "https://docs.cntd.ru/document/566276706",
      "https://docs.cntd.ru/document/1200107325"
    ],
  };

  // ImageObject
  schemas["article-image"] = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "@id": `${coverUrl}#image`,
    contentUrl: coverUrl,
    name: article.cover_alt || article.title,
    caption: article.cover_alt || article.title,
    description: desc || `Article image: «${article.title}».`,
    encodingFormat: getImgEncodingFormat(coverUrl),
  };

  if (faqs && faqs.length > 0) {
    schemas.faq = buildFaqJsonLd(faqs, pageUrl);
  }

  return schemas;
};

export interface ArticleJsonLdParams {
  pageUrl: string;
  headline: string;
  description: string;
  baseUrl?: string;
  imageUrl?: string;
  articleSection?: string;
  articleBody?: string;
  datePublished?: string;
  dateModified?: string;
  citation?: string[];
  about?: string;
}

/**
 * 10. Schema.org Article for search and AI search engines.
 */
export const buildArticleJsonLd = ({
  pageUrl,
  headline,
  description,
  baseUrl = BASE_URL,
  imageUrl,
  articleSection,
  articleBody,
  datePublished,
  dateModified,
  citation = [
    "https://docs.cntd.ru/document/566276706",
    "https://docs.cntd.ru/document/1200107325",
  ],
  about,
}: ArticleJsonLdParams): Record<string, any> => {
  const nowIso = new Date().toISOString().split("T")[0];
  const effectivePublished = datePublished
    ? datePublished.substring(0, 10)
    : nowIso;
  const effectiveModified = dateModified
    ? dateModified.substring(0, 10)
    : effectivePublished;
  const coverUrl = imageUrl
    ? imageUrl.startsWith("http")
      ? imageUrl
      : `${baseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`
    : `${baseUrl}/logo.png`;

  const articleSchema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": ["Article", "BlogPosting"],
    "@id": `${pageUrl}#article`,
    url: pageUrl,
    headline,
    name: headline,
    description,
    image: {
      "@type": "ImageObject",
      "@id": `${coverUrl}#image`,
      url: coverUrl,
      contentUrl: coverUrl,
    },
    datePublished: effectivePublished,
    dateModified: effectiveModified,
    author: {
      "@id": `${baseUrl}/#organization`,
    },
    publisher: {
      "@id": `${baseUrl}/#organization`,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    inLanguage: "en-US",
    citation,
  };

  if (articleSection) {
    articleSchema.articleSection = articleSection;
  }

  if (articleBody) {
    articleSchema.articleBody = articleBody;
  }

  if (about) {
    articleSchema.about = {
      "@type": "Thing",
      name: about,
    };
  }

  return articleSchema;
};

export interface JsonLdProps {
  /**
   * Pass a schema, schema array or complete @graph directly.
   * Preserve compatibility with existing callers.
   */
  data?: Record<string, any> | Array<Record<string, any>> | null | undefined;

  /** Relative or absolute page path, such as / or /catalog/sets. */
  pagePath?: string;
  /** Page title. */
  title?: string;
  /** Page meta description. */
  description?: string;
  /** Public base URL for the site. */
  baseUrl?: string;
  /** Company information. */
  companyInfo?: CompanyInfoJsonLdParams;
  /** A product for its detail page at /product/[id]. */
  product?: ProductItem;
  /** Products for a catalog, category or home page. */
  products?: ProductItem[];
  /** Catalog collection. */
  collection?: CollectionJsonLdParams;
  /** Breadcrumbs. */
  breadcrumbs?: BreadcrumbItem[];
  /** Frequently asked questions. */
  faqs?: FaqItem[];
  /** Blog article for /blog/[slug]. */
  article?: BlogArticle;
  /** Articles for the /blog listing. */
  articles?: readonly SimpleBlogArticle[] | SimpleBlogArticle[];
  /** Custom schemas. */
  customSchemas?: Record<string, any>;
}

/**
 * Universal component for rendering Schema.org JSON-LD.
 * Accept direct schemas through data or declaratively generate
 * a single connected graph following Schema.org conventions.
 */
export const JsonLd: React.FC<JsonLdProps> = ({
  data,
  pagePath,
  title,
  description,
  baseUrl = BASE_URL,
  companyInfo,
  product,
  products,
  collection,
  breadcrumbs,
  faqs,
  article,
  articles,
  customSchemas,
}) => {
  // 1. Direct schema input for backward compatibility.
  if (data) {
    const formattedData = Array.isArray(data)
      ? buildGraphJsonLd(data)
      : data;

    if (ENABLE_DEBUG_JSON_FILE) {
      writeDebugJsonLd(formattedData);
    }

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(formattedData) }}
      />
    );
  }

  // 2. Declarative @graph generation.
  if (!pagePath && !title) {
    return null;
  }

  const cleanPath = (pagePath || "/").startsWith("/")
    ? pagePath || "/"
    : `/${pagePath}`;
  const pageUrl = `${baseUrl}${cleanPath === "/" ? "" : cleanPath}`;

  const schemas: Record<string, any> = {
    website: buildWebSiteJsonLd({ baseUrl }),
    organization: buildOrganizationJsonLd({ baseUrl, ...companyInfo }),
  };

  const hasBreadcrumbs = breadcrumbs && breadcrumbs.length > 0;
  if (hasBreadcrumbs) {
    schemas.breadcrumb = buildBreadcrumbsJsonLd(breadcrumbs, pageUrl);
  }

  if (title) {
    schemas.webpage = buildWebPageJsonLd({
      pageUrl,
      title,
      description,
      baseUrl,
      breadcrumbId: hasBreadcrumbs
        ? pageUrl === baseUrl || pageUrl.endsWith("/")
          ? `${pageUrl.replace(/\/$/, "")}/#breadcrumb`
          : `${pageUrl}#breadcrumb`
        : undefined,
      mainEntityId: product
        ? `${pageUrl}#product`
        : products && products.length > 0
          ? `${pageUrl}#itemlist`
          : collection
            ? `${pageUrl}#collection`
            : undefined,
    });
  }

  // Single product detail page.
  if (product) {
    const { productSchema, offerSchema } = buildProductSchemas({
      product,
      url: pageUrl,
      baseUrl,
      brandName: companyInfo?.companyName || "Chef Meal Catering",
    });
    schemas.product = productSchema;
    schemas.offer = offerSchema;
  }

  // Products for a catalog, section or home page.
  if (products && products.length > 0) {
    schemas.itemlist = buildItemListJsonLd(products, pageUrl, baseUrl);

    products.forEach((prod, index) => {
      const prodSlug = prod.slug || "";
      const prodUrl = `${baseUrl}/product/${prodSlug}`;
      const { productSchema, offerSchema } = buildProductSchemas({
        product: prod,
        url: prodUrl,
        baseUrl,
        brandName: companyInfo?.companyName || "Chef Meal Catering",
      });
      const schemaKey = prod.slug || `product-${index + 1}`;
      schemas[`product-${schemaKey}`] = productSchema;
      schemas[`offer-${schemaKey}`] = offerSchema;
    });
  }

  if (collection) {
    schemas.collection = buildCollectionJsonLd({
      ...collection,
      url: pageUrl,
      baseUrl,
      mainEntityId:
        products && products.length > 0
          ? `${pageUrl}#itemlist`
          : collection.mainEntityId,
    });
  }

  if (faqs && faqs.length > 0) {
    schemas.faq = buildFaqJsonLd(faqs, pageUrl);
  }

  // Blog listing at /blog.
  if (
    (cleanPath === "/blog" || cleanPath === "/blog/") &&
    articles &&
    articles.length > 0
  ) {
    const blogSchemas = buildBlogListingSchemas({
      articles,
      pageUrl,
      baseUrl,
      title:
        title ||
        "Catering blog — articles and tips | Chef Meal Catering",
      description,
    });
    delete schemas.webpage;
    Object.assign(schemas, blogSchemas);
  }

  // Blog article at /blog/[slug].
  if (cleanPath.startsWith("/blog/") && article) {
    const articleSchemas = buildArticleDetailSchemas({
      article,
      pageUrl,
      baseUrl,
      brandName: companyInfo?.companyName || "Chef Meal Catering",
      faqs,
    });
    delete schemas.webpage;
    delete schemas.breadcrumb;
    Object.assign(schemas, articleSchemas);
  }

  // Add an Article schema for AI search unless already supplied.
  if (!schemas.article && !schemas.blogposting && (title || description)) {
    const articleTitle = title || "Catering and buffet delivery in Naberezhnye Chelny";
    const articleDesc =
      description ||
      "Chef Meal provides off-site catering and ready-made buffet platter delivery in Naberezhnye Chelny.";
    schemas.article = buildArticleJsonLd({
      pageUrl,
      headline: articleTitle,
      description: articleDesc,
      baseUrl,
      imageUrl: product?.imageUrl || `${baseUrl}/logo.png`,
      articleSection:
        collection?.name ||
        (cleanPath.startsWith("/catalog") ? "Food catalog" : "Catering"),
      about: product?.name || collection?.name,
    });
  }

  if (customSchemas) {
    Object.entries(customSchemas).forEach(([key, schema]) => {
      if (schema) schemas[key] = schema;
    });
  }

  const jsonLd = buildGraphJsonLd(schemas);

  if (ENABLE_DEBUG_JSON_FILE) {
    writeDebugJsonLd(jsonLd);
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};




