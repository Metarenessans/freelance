import { BASE_URL } from "./json-ld-config";
import {
  buildWebSiteJsonLd,
  buildOrganizationJsonLd,
  buildBreadcrumbsJsonLd,
  buildWebPageJsonLd,
  buildProductSchemas,
  buildItemListJsonLd,
  buildGraphJsonLd,
  buildFaqJsonLd,
  buildBlogListingSchemas,
  buildArticleDetailSchemas,
  buildArticleJsonLd,
} from "./json-ld";
import {
  getCachedSections,
  getCachedCategories,
  getCachedProducts,
  getCachedCompanyInfo,
  getCachedFaq,
  getCachedCalculateConfig,
} from "./server-catalog-cache";
import { getArticles, getArticle } from "@/store/services/blogApi";
import type { Section, Category, Product } from "@/store/services/catalogApi";
import type { FaqItem } from "@/store/services/faqApi";
import {
  toPublicMediaUrl,
  buildProductTitle,
  buildProductDescription,
  buildSectionTitle,
  buildSectionDescription,
} from "@/utils/seo";
import { matchProductBySlug } from "@/utils/slugify";

export async function generateJsonLdForPath(
  rawPath: string
): Promise<Record<string, any>> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || BASE_URL;

  // Clean path (remove query params and hash)
  const cleanPath =
    (rawPath || "/").split("?")[0].split("#")[0].trim() || "/";
  const normalizedPath = cleanPath.startsWith("/")
    ? cleanPath
    : `/${cleanPath}`;

  const companyInfo = await getCachedCompanyInfo();

  // 1. Home page.
  if (normalizedPath === "/" || normalizedPath === "") {
    const pageUrl = baseUrl;
    const title =
      "Chef Meal Catering | Buffet and catering delivery in Naberezhnye Chelny";
    const description =
      "Order catering, banquet dishes and buffet food for delivery in Naberezhnye Chelny. Delicious appetizers, bruschetta, canapes and ready-made party platters from Chef Meal Catering.";

    const [rawFaqs, articles] = await Promise.all([
      getCachedFaq(),
      getArticles(),
    ]);

    const formattedFaqs = (rawFaqs || [])
      .map((f: FaqItem) => ({
        question: f.question,
        answer: Array.isArray(f.answerItems)
          ? f.answerItems.join(" ")
          : (f as unknown as { answer?: string }).answer || "",
      }))
      .filter((f) => f.question && f.answer);

    const schemas: Record<string, any> = {
      website: buildWebSiteJsonLd({ baseUrl }),
      organization: buildOrganizationJsonLd({ baseUrl, ...companyInfo }),
      breadcrumb: buildBreadcrumbsJsonLd(
        [{ name: "Home", url: baseUrl }],
        pageUrl,
        baseUrl
      ),
      webpage: buildWebPageJsonLd({
        pageUrl,
        title,
        description,
        baseUrl,
        breadcrumbId: `${pageUrl}#breadcrumb`,
      }),
    };

    if (formattedFaqs.length > 0) {
      schemas.faq = buildFaqJsonLd(formattedFaqs, pageUrl);
    }

    // Article and BlogPosting schemas for search engines and AI search.
    const featured = articles && articles.length > 0 ? articles[0] : null;
    if (featured) {
      const articleSlug = featured.slug || featured.id;
      const articleUrl = `${baseUrl}/blog/${articleSlug}`;
      const coverUrl = featured.cover
        ? toPublicMediaUrl(featured.cover, baseUrl)
        : `${baseUrl}/logo.png`;
      const featPublished = featured.created_date || (featured as any).created_at;
      const featModified = (featured as any).updated_at || featPublished;

      schemas.article = buildArticleJsonLd({
        pageUrl: articleUrl,
        headline: featured.title,
        description: featured.seo_description || featured.title,
        baseUrl,
        imageUrl: coverUrl,
        datePublished: featPublished,
        dateModified: featModified,
        articleSection: "Catering and buffet platters",
      });
    } else {
      schemas.article = buildArticleJsonLd({
        pageUrl: baseUrl,
        headline: "Catering and buffet platter delivery in Naberezhnye Chelny - Chef Meal",
        description: "Explore Chef Meal catering: ready-made buffet platters and party appetizers with delivery across Naberezhnye Chelny.",
        baseUrl,
        imageUrl: `${baseUrl}/logo.png`,
        articleSection: "Catering and buffet delivery",
      });
    }

    return buildGraphJsonLd(schemas);
  }

  // 2. Product page or modal at /product/[slug].
  if (normalizedPath.startsWith("/product/")) {
    const idOrSlug = decodeURIComponent(
      normalizedPath.replace(/^\/product\//, "")
    ).replace(/\/$/, "");

    const [products, sections, rawFaqs] = await Promise.all([
      getCachedProducts(),
      getCachedSections(),
      getCachedFaq(),
    ]);

    const product =
      products.find(
        (p: Product) => p.slug === idOrSlug || String(p.id) === idOrSlug
      ) || matchProductBySlug(idOrSlug, products);

    const title = product ? buildProductTitle(product.name) : "Food catalog";
    const description = product
      ? buildProductDescription({
        name: product.name,
        description: product.description,
        maxLen: 155,
      })
      : "Order buffet platters, appetizers and catering for delivery in Naberezhnye Chelny from Chef Meal Catering.";

    const section = product?.categoryId
      ? sections.find((s) => s.categories?.includes(product.categoryId))
      : undefined;

    const productUrl = product?.slug
      ? `/product/${product.slug}`
      : `/product/${idOrSlug}`;
    const pageUrl = `${baseUrl}${productUrl}`;

    const breadcrumbs = [
      { name: "Home", url: baseUrl },
      ...(section
        ? [{ name: section.name, url: `${baseUrl}/catalog/${section.id}` }]
        : []),
      { name: product?.name || "Dish", url: pageUrl },
    ];

    const schemas: Record<string, any> = {
      website: buildWebSiteJsonLd({ baseUrl }),
      organization: buildOrganizationJsonLd({ baseUrl, ...companyInfo }),
      breadcrumb: buildBreadcrumbsJsonLd(breadcrumbs, pageUrl),
      webpage: buildWebPageJsonLd({
        pageUrl,
        title,
        description,
        baseUrl,
        breadcrumbId: `${pageUrl}#breadcrumb`,
        mainEntityId: `${pageUrl}#product`,
      }),
    };

    if (product) {
      const { productSchema, offerSchema } = buildProductSchemas({
        product,
        url: pageUrl,
        baseUrl,
        brandName: companyInfo?.companyName || "Chef Meal Catering",
      });
      schemas.product = productSchema;
      schemas.offer = offerSchema;

      const prodImg = product.imageUrl
        ? toPublicMediaUrl(product.imageUrl, baseUrl)
        : `${baseUrl}/logo.png`;
      const sectionName = section?.name || "Buffet dishes and platters";

      const prodCreatedAt = (product as any).created_at || (product as any).created_date;
      const prodUpdatedAt = (product as any).updated_at || prodCreatedAt;

      schemas.article = buildArticleJsonLd({
        pageUrl,
        headline: `${product.name} - ingredients, presentation and preparation standards`,
        description,
        baseUrl,
        imageUrl: prodImg,
        articleSection: sectionName,
        about: product.name,
        datePublished: prodCreatedAt,
        dateModified: prodUpdatedAt,
      });
    } else {
      schemas.article = buildArticleJsonLd({
        pageUrl,
        headline: title,
        description,
        baseUrl,
        articleSection: "Food catalog",
      });
    }

    const formattedFaqs = (rawFaqs || [])
      .map((f: FaqItem) => ({
        question: f.question,
        answer: Array.isArray(f.answerItems)
          ? f.answerItems.join(" ")
          : (f as unknown as { answer?: string }).answer || "",
      }))
      .filter((f) => f.question && f.answer);

    if (formattedFaqs.length > 0) {
      schemas.faq = buildFaqJsonLd(formattedFaqs, pageUrl);
    }

    return buildGraphJsonLd(schemas);
  }

  // 3. Catalog section page at /catalog/[slug].
  if (normalizedPath.startsWith("/catalog/")) {
    const slug = decodeURIComponent(
      normalizedPath.replace(/^\/catalog\//, "")
    ).replace(/\/$/, "");

    const [sections, categories, allProducts, rawFaqs] = await Promise.all([
      getCachedSections(),
      getCachedCategories(),
      getCachedProducts(),
      getCachedFaq(),
    ]);

    const section = sections.find((s: Section) => s.id === slug);
    const products = allProducts.filter((p: Product) => {
      if (section?.categories && p.categoryId) {
        return section.categories.includes(p.categoryId);
      }
      return false;
    });
    const pageUrl = `${baseUrl}/catalog/${slug}`;

    const rawCatNames = (section?.categories || [])
      .map(
        (catId: string) => categories.find((c: Category) => c.id === catId)?.name
      )
      .filter((name: string | undefined): name is string => Boolean(name));

    const title = section
      ? buildSectionTitle(section.name)
      : "Buffet menu";
    const description = section
      ? buildSectionDescription({
        sectionName: section.name,
        categories: rawCatNames,
        maxLen: 155,
      })
      : "Buffet platters and appetizers from Chef Meal Catering.";

    const breadcrumbs = [
      { name: "Home", url: baseUrl },
      { name: section?.name || "Catalog", url: pageUrl },
    ];

    const schemas: Record<string, any> = {
      website: buildWebSiteJsonLd({ baseUrl }),
      organization: buildOrganizationJsonLd({ baseUrl, ...companyInfo }),
      breadcrumb: buildBreadcrumbsJsonLd(breadcrumbs, pageUrl),
      webpage: buildWebPageJsonLd({
        pageUrl,
        title,
        description,
        baseUrl,
        breadcrumbId: `${pageUrl}#breadcrumb`,
        mainEntityId: `${pageUrl}#itemlist`,
      }),
    };

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

    const formattedFaqs = (rawFaqs || [])
      .map((f: FaqItem) => ({
        question: f.question,
        answer: Array.isArray(f.answerItems)
          ? f.answerItems.join(" ")
          : (f as unknown as { answer?: string }).answer || "",
      }))
      .filter((f) => f.question && f.answer);

    const firstProdImg = products?.[0]?.imageUrl
      ? toPublicMediaUrl(products[0].imageUrl, baseUrl)
      : `${baseUrl}/logo.png`;

    const firstProd = products?.[0] as any;
    const secDate = firstProd?.updated_at || firstProd?.created_at;

    schemas.article = buildArticleJsonLd({
      pageUrl,
      headline: section
        ? `Menu and table setting guide: ${section.name}`
        : title,
      description,
      baseUrl,
      imageUrl: firstProdImg,
      articleSection: section?.name || "Catering catalog",
      about: section?.name || "Buffet dishes",
      datePublished: secDate,
      dateModified: secDate,
    });

    if (formattedFaqs.length > 0) {
      schemas.faq = buildFaqJsonLd(formattedFaqs, pageUrl);
    }

    return buildGraphJsonLd(schemas);
  }

  // 4. Cart at /cart.
  if (normalizedPath === "/cart") {
    const pageUrl = `${baseUrl}/cart`;
    const title = "Cart - Chef Meal Catering";
    const description =
      "Order catering and buffet platters from Chef Meal Catering.";
    const breadcrumbs = [
      { name: "Home", url: baseUrl },
      { name: "Cart", url: pageUrl },
    ];

    return buildGraphJsonLd({
      website: buildWebSiteJsonLd({ baseUrl }),
      organization: buildOrganizationJsonLd({ baseUrl, ...companyInfo }),
      breadcrumb: buildBreadcrumbsJsonLd(breadcrumbs, pageUrl),
      webpage: buildWebPageJsonLd({
        pageUrl,
        title,
        description,
        baseUrl,
        breadcrumbId: `${pageUrl}#breadcrumb`,
      }),
      article: buildArticleJsonLd({
        pageUrl,
        headline: "Ordering, delivery and catering terms",
        description,
        baseUrl,
        articleSection: "Ordering and delivery terms",
      }),
    });
  }

  // 5. Menu planner at /calculate.
  if (normalizedPath === "/calculate") {
    const pageUrl = `${baseUrl}/calculate`;
    const calculateConfig = await getCachedCalculateConfig();
    const title =
      calculateConfig.seo_title ||
      "Online catering menu planner - free banquet and buffet estimate | Chef Meal";
    const description =
      calculateConfig.seo_description ||
      "Get a free catering estimate for your event, guest count and budget in Naberezhnye Chelny. A personalized quote in 15 minutes!";
    const breadcrumbs = [
      { name: "Home", url: baseUrl },
      { name: "Get a menu estimate", url: pageUrl },
    ];

    const schemas: Record<string, any> = {
      website: buildWebSiteJsonLd({ baseUrl }),
      organization: buildOrganizationJsonLd({ baseUrl, ...companyInfo }),
      breadcrumb: buildBreadcrumbsJsonLd(breadcrumbs, pageUrl),
      webpage: buildWebPageJsonLd({
        pageUrl,
        title,
        description,
        baseUrl,
        breadcrumbId: `${pageUrl}#breadcrumb`,
      }),
    };

    schemas.article = buildArticleJsonLd({
      pageUrl,
      headline: "Guide to online banquet and buffet menu estimates",
      description,
      baseUrl,
      imageUrl: `${baseUrl}/images/calculate-og.jpg`,
      articleSection: "Catering menu planner",
    });

    if (calculateConfig.faqs && calculateConfig.faqs.length > 0) {
      schemas.faq = buildFaqJsonLd(calculateConfig.faqs, pageUrl);
    }

    return buildGraphJsonLd(schemas);
  }

  // 6. Privacy policy at /privacy-policy.
  if (normalizedPath === "/privacy-policy") {
    const pageUrl = `${baseUrl}/privacy-policy`;
    const title =
      "Personal data processing policy | Chef Meal Catering";
    const description =
      "How Chef Meal Catering processes and protects personal data for its catering delivery service in Naberezhnye Chelny.";
    const breadcrumbs = [
      { name: "Home", url: baseUrl },
      { name: "Privacy policy", url: pageUrl },
    ];

    return buildGraphJsonLd({
      website: buildWebSiteJsonLd({ baseUrl }),
      organization: buildOrganizationJsonLd({ baseUrl, ...companyInfo }),
      breadcrumb: buildBreadcrumbsJsonLd(breadcrumbs, pageUrl),
      webpage: buildWebPageJsonLd({
        pageUrl,
        title,
        description,
        baseUrl,
        breadcrumbId: `${pageUrl}#breadcrumb`,
      }),
      article: buildArticleJsonLd({
        pageUrl,
        headline: "Privacy and personal data protection policy",
        description,
        baseUrl,
        articleSection: "Legal information",
      }),
    });
  }

  // 7. Blog listing at /blog.
  if (normalizedPath === "/blog" || normalizedPath === "/blog/") {
    const pageUrl = `${baseUrl}/blog`;
    const title =
      "Catering blog - articles and tips | Chef Meal Catering";
    const description =
      "Chef tips on buffet portions, table settings, party food boxes and event catering in Naberezhnye Chelny. Read the Chef Meal blog!";

    const [articles, rawFaqs] = await Promise.all([
      getArticles(),
      getCachedFaq(),
    ]);

    const schemas: Record<string, any> = {
      website: buildWebSiteJsonLd({ baseUrl }),
      organization: buildOrganizationJsonLd({ baseUrl, ...companyInfo }),
    };

    const formattedFaqs = (rawFaqs || [])
      .map((f: FaqItem) => ({
        question: f.question,
        answer: Array.isArray(f.answerItems)
          ? f.answerItems.join(" ")
          : (f as unknown as { answer?: string }).answer || "",
      }))
      .filter((f) => f.question && f.answer);

    if (formattedFaqs.length > 0) {
      schemas.faq = buildFaqJsonLd(formattedFaqs, pageUrl);
    }

    const blogSchemas = buildBlogListingSchemas({
      articles,
      pageUrl,
      baseUrl,
      title,
      description,
    });

    Object.assign(schemas, blogSchemas);

    schemas.article = buildArticleJsonLd({
      pageUrl,
      headline: "Catering and buffet planning guides and expert articles",
      description,
      baseUrl,
      imageUrl: articles?.[0]?.cover
        ? toPublicMediaUrl(articles[0].cover, baseUrl)
        : `${baseUrl}/logo.png`,
      articleSection: "Blog and guides",
    });

    return buildGraphJsonLd(schemas);
  }

  // 8. Blog article at /blog/[slug].
  if (normalizedPath.startsWith("/blog/")) {
    const slug = decodeURIComponent(
      normalizedPath.replace(/^\/blog\//, "")
    ).replace(/\/$/, "");

    const [article, rawFaqs] = await Promise.all([
      getArticle(slug),
      getCachedFaq(),
    ]);

    if (article) {
      const pageUrl = `${baseUrl}/blog/${slug}`;
      const brandName =
        companyInfo?.legalName ||
        companyInfo?.companyName ||
        "Chef Meal Catering";

      const formattedFaqs = (rawFaqs || [])
        .map((f: FaqItem) => ({
          question: f.question,
          answer: Array.isArray(f.answerItems)
            ? f.answerItems.join(" ")
            : (f as unknown as { answer?: string }).answer || "",
        }))
        .filter((f) => f.question && f.answer);

      const rawArticleFaqs = (article as any).faqs;
      const effectiveFaqs =
        rawArticleFaqs && rawArticleFaqs.length > 0
          ? rawArticleFaqs
              .map((f: any) => ({
                question: f.question,
                answer: Array.isArray(f.answerItems)
                  ? f.answerItems.join(" ")
                  : f.answer || "",
              }))
              .filter((f: any) => f.question && f.answer)
          : formattedFaqs;

      const schemas: Record<string, any> = {
        website: buildWebSiteJsonLd({ baseUrl }),
        organization: buildOrganizationJsonLd({ baseUrl, ...companyInfo }),
      };

      const articleSchemas = buildArticleDetailSchemas({
        article,
        pageUrl,
        baseUrl,
        brandName,
        faqs: effectiveFaqs,
      });

      Object.assign(schemas, articleSchemas);
      if (schemas.blogposting) {
        schemas.article = schemas.blogposting;
        delete schemas.blogposting;
      }

      if (effectiveFaqs.length > 0 && !schemas.faq) {
        schemas.faq = buildFaqJsonLd(effectiveFaqs, pageUrl);
      }

      return buildGraphJsonLd(schemas);
    }
  }

  // Fallback
  const pageUrl = `${baseUrl}${normalizedPath}`;
  return buildGraphJsonLd({
    website: buildWebSiteJsonLd({ baseUrl }),
    organization: buildOrganizationJsonLd({ baseUrl, ...companyInfo }),
    webpage: buildWebPageJsonLd({
      pageUrl,
      title: "Chef Meal Catering",
      description: "Catering and buffet delivery in Naberezhnye Chelny",
      baseUrl,
    }),
    article: buildArticleJsonLd({
      pageUrl,
      headline: "Catering and buffet platter delivery Chef Meal in Naberezhnye Chelny",
      description: "Catering and buffet delivery in Naberezhnye Chelny by Chef Meal Catering. Fresh food, beautiful presentation and prompt delivery.",
      baseUrl,
      articleSection: "Catering",
    }),
  });
}
