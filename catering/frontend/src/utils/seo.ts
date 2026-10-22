/**
 * Utilities for dynamic SEO titles and descriptions.
 * Fit generated copy to search snippet length limits.
 *
 * Search snippet length targets:
 * Titles include the brand suffix; account for its length.
 * Descriptions aim to avoid truncation in search results.
 */

/**
 * Trim at sentence or word boundaries without splitting words.
 */
export const truncateToWord = (text: string, maxLen = 165, addEllipsis = false): string => {
  if (!text) return "";
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLen) return cleaned;

  const sub = cleaned.slice(0, maxLen);

  // 1. Prefer the end of a sentence.
  const lastSentenceEnd = Math.max(
    sub.lastIndexOf(". "),
    sub.lastIndexOf("! "),
    sub.lastIndexOf("? ")
  );
  if (lastSentenceEnd >= Math.floor(maxLen * 0.5)) {
    return sub.slice(0, lastSentenceEnd + 1).trim();
  }

  // 2. Trim at the last space and remove dangling conjunctions.
  const lastSpace = sub.lastIndexOf(" ");
  if (lastSpace >= Math.floor(maxLen * 0.35)) {
    const candidate = sub
      .slice(0, lastSpace)
      .replace(/[,;:\-\s!]+$/, "")
      .replace(/\s+(and|in|on|with|for|from|to|of|or|but)$/i, "")
      .trim();
    if (candidate.length >= Math.floor(maxLen * 0.35)) {
      return addEllipsis ? `${candidate}...` : candidate;
    }
  }

  const base = sub.slice(0, maxLen).replace(/[,;:\-\s!]+$/, "").trim();
  return addEllipsis ? `${base}...` : base;
};

/**
 * Format a list as a natural English phrase:
 * [A] becomes A.
 * [A, B] becomes A and B.
 * [A, B, C] becomes A, B and C.
 */
export const formatCategoryList = (items: string[]): string => {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
};

/**
 * Generate a catalog section title.
 * Reserve room for the Next.js brand suffix.
 * Keep the base title within the configured title budget.
 */
export const buildSectionTitle = (sectionName: string, maxLen = 43): string => {
  const clean = sectionName.trim();
  const suffix = " - buffet food catalog";
  if (clean.length + suffix.length <= maxLen) {
    if (clean.length + suffix.length < 33) {
      const setSuffix = " - buffet platter and food catalog";
      if (clean.length + setSuffix.length <= maxLen) {
        return `${clean}${setSuffix}`;
      }
    }
    return `${clean}${suffix}`;
  }
  const shortSuffix = " - food catalog";
  if (clean.length + shortSuffix.length <= maxLen) {
    return `${clean}${shortSuffix}`;
  }
  if (clean.length <= maxLen) {
    return clean;
  }
  return truncateToWord(clean, maxLen);
};

interface SectionDescriptionParams {
  sectionName: string;
  categories?: string[];
  maxLen?: number;
}

/**
 * Build a catalog section description from its name and categories.
 * Include the service, categories and delivery area.
 *
 * Fit the complete text within maxLen.
 */
export const buildSectionDescription = ({
  sectionName,
  categories = [],
  maxLen = 165,
}: SectionDescriptionParams): string => {
  const cleanSection = sectionName.trim();
  const prefix = `Catalog «${cleanSection}» from Chef Meal Catering. `;
  const suffix = ` Order delivery in Naberezhnye Chelny!`;

  // Clean category names.
  const cleanCats = categories
    .map((c) => c.replace(/[\u{1F300}-\u{1FAFF}]/gu, "").trim())
    .filter(
      (c) =>
        Boolean(c) &&
        c.toLowerCase() !== "value" &&
        c.toLowerCase() !== cleanSection.toLowerCase()
    );

  const available = maxLen - prefix.length - suffix.length;

  if (available <= 15 || cleanCats.length === 0) {
    const fallback = `Catalog «${cleanSection}» from Chef Meal Catering. Delicious party food and appetizers for adults and children. Order delivery in Naberezhnye Chelny!`;
    return fallback.length <= maxLen ? fallback : truncateToWord(fallback, maxLen);
  }

  // 1. Try category names with an audience suffix.
  const chosen: string[] = [];
  for (const cat of cleanCats) {
    const candidate = [...chosen, cat];
    const candidateText = `${formatCategoryList(candidate)} for adults and children.`;
    if (candidateText.length <= available) {
      chosen.push(cat);
    } else {
      break;
    }
  }

  if (chosen.length > 0) {
    const full = `${prefix}${formatCategoryList(chosen)} for adults and children.${suffix}`;
    if (full.length <= maxLen) return full;
  }

  // 2. If too long, use only category names.
  const chosenShort: string[] = [];
  for (const cat of cleanCats) {
    const candidate = [...chosenShort, cat];
    const candidateText = `${formatCategoryList(candidate)}.`;
    if (candidateText.length <= available) {
      chosenShort.push(cat);
    } else {
      break;
    }
  }

  if (chosenShort.length > 0) {
    const full = `${prefix}${formatCategoryList(chosenShort)}.${suffix}`;
    if (full.length <= maxLen) return full;
  }

  // 3. Fallback
  const shortFallback = `${prefix}Fresh platters and appetizers for celebrations with adults and children.${suffix}`;
  return shortFallback.length <= maxLen
    ? shortFallback
    : truncateToWord(shortFallback, maxLen);
};

/**
 * Generate a product title.
 * Include the brand within the title length limit.
 */
/**
 * Remove emoji and dangling punctuation from product names.
 */
export const cleanProductName = (name?: string): string => {
  if (!name) return "";
  const cleaned = name
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
    .replace(/[🔥❤️💥👍⭐✨🎉🎈]/g, "")
    .replace(/['"`“”«»]/g, "") // Remove inner quotes to avoid entity expansion in metadata.
    .replace(/\s+([,.:;?!])/g, "$1")
    .replace(/,([^\s\d])/g, ", $1")
    .replace(/(\d+)(\u0448\u0442|\u0431\u043e\u043a\u0441\u043e\u0432|\u0431\u043e\u043a\u0441\u0430|\u043f\u043e\u0440\u0446\u0438\u0439)/g, "$1 $2")
    .replace(/\s+/g, " ")
    .replace(/(\s*\|\s*Chef\s+Meal(\s+Catering)?)+$/gi, "")
    .trim();
  return cleaned.replace(/[,;:\-\s!.]*$/, "").trim();
};

export const cleanProductDescriptionText = (desc?: string): string => {
  if (!desc) return "";
  const t = desc
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
    .replace(/[🔥❤️💥👍⭐✨🎉🎈]/g, "")
    .replace(/['"`“”«»]/g, "")
    .replace(/^\s*\d+[\.\)]\s*/, "")
    .replace(/\n\s*\d+[\.\)]\s*/g, ", ")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t.replace(/[,;:\-\s]+$/, "").trim();
};

export const buildProductFullTitle = (name: string, categoryName?: string): string => {
  const clean = cleanProductName(name);
  if (!clean) {
    return "Buffet dishes and platter catalog | Chef Meal Catering";
  }

  const brand = " | Chef Meal Catering"; // Brand suffix.

  // Avoid adding the brand twice.
  if (clean.includes("Chef Meal Catering")) {
    if (clean.length >= 50 && clean.length <= 62) return clean;
    if (clean.length > 62) return truncateToWord(clean, 60);
    for (const pad of [" - order in Chelny", " - delivery", " - menu"]) {
      const cand = `${clean}${pad}`;
      if (cand.length >= 50 && cand.length <= 62) return cand;
    }
    return clean;
  }

  // 1. Medium-length names can be followed directly by the brand.
  if (clean.length >= 33 && clean.length <= 45) {
    return `${clean}${brand}`;
  }

  // 2. Shorten long names at word boundaries.
  if (clean.length > 45) {
    for (const target of [45, 44, 43, 42, 41, 40]) {
      const shortened = truncateToWord(clean, target);
      const cand = `${shortened}${brand}`;
      if (cand.length >= 50 && cand.length <= 62) return cand;
    }
    return `${truncateToWord(clean, 43)}${brand}`;
  }

  // 3. Add a natural descriptive suffix to shorter names.
  if (clean.length >= 22 && clean.length <= 32) {
    const mediumSuffixes = [
      " - order for delivery",
      " - buffet delivery",
      " - buffet dish",
      " - order in Chelny",
      " - made to order for delivery",
      " - order for a buffet",
      " - order now",
      " - delivery",
      " made to order",
      " for a buffet",
      " for a celebration",
    ];
    for (const s of mediumSuffixes) {
      const cand = `${clean}${s}${brand}`;
      if (cand.length >= 50 && cand.length <= 62) return cand;
    }
    return `${clean} - delivery${brand}`;
  }

  // 4. Expand very short names with relevant search phrases.
  const shortSuffixes = [
    " - order delivery in Chelny",
    " - order for prompt delivery",
    " - order for a buffet in Chelny",
    " - ready-made buffet dish",
    " - buffet dishes for delivery",
    " - order for delivery",
    " - buffet delivery",
    " - catering in Chelny",
    " - buffet dish",
    " - order for a celebration",
  ];
  for (const s of shortSuffixes) {
    const cand = `${clean}${s}${brand}`;
    if (cand.length >= 50 && cand.length <= 62) return cand;
  }

  // Guaranteed fallback.
  const fallback = `${clean} - order for delivery${brand}`;
  if (fallback.length >= 50 && fallback.length <= 62) return fallback;
  if (fallback.length < 50) {
    return `${clean} - order delivery in Chelny${brand}`.slice(0, 62);
  }
  return fallback.slice(0, 62);
};

export const buildProductTitle = (name: string, maxLen = 43): string => {
  return buildProductFullTitle(name);
};

export interface ProductDescriptionParams {
  name: string;
  description?: string;
  categoryName?: string;
  maxLen?: number;
}

/**
 * Generate a product description within the configured length budget.
 * Use the database description when available, otherwise use a food description.
 */
export const buildProductDescription = ({
  name,
  description,
  categoryName,
  maxLen = 155,
}: ProductDescriptionParams): string => {
  const cleanName = cleanProductName(name);
  const cleanDesc = cleanProductDescriptionText(description);

  // Choose a delivery suffix based on the available space.
  // 1. Prefer the complete delivery call to action.
  // 2. Use a shorter delivery phrase for longer names.
  const suffixPrimary = " Order food delivery in Naberezhnye Chelny!";
  const suffixShort = " Delivery in Naberezhnye Chelny!";

  if (!cleanName) {
    return `Buffet dishes from Chef Meal Catering.${suffixPrimary}`.slice(0, maxLen);
  }

  const prefixes = [
    `«${cleanName}» from Chef Meal Catering. `,
    `Dish «${cleanName}» from Chef Meal Catering. `,
    `«${cleanName}» from Chef Meal Catering. `,
    `«${cleanName}» from Chef Meal Catering. `,
  ];

  const defaultMiddles = [
    "Delicious party appetizers made with quality ingredients for your banquet guests.",
    "Delicious appetizers made with fresh ingredients for adults and children.",
    "Elegant buffet treats and appetizers for a celebration or banquet.",
    "Delicious fresh appetizers and platters for celebrations with adults and children.",
    "Fresh party appetizers for adults and children at corporate events or banquets.",
    "Delicious dishes for your celebration or banquet.",
    "Fresh party appetizers for adults and children.",
    "Delicious dishes for buffets and celebrations.",
    "Delicious party treats for your guests.",
    "Delicious ready-made food for adults and children.",
    "Fresh party dishes for your guests.",
    "Fresh appetizers for adults and children.",
    "Delicious food for your celebration.",
    "Party appetizers for your guests.",
    "Fresh platters for your celebration.",
    "Fresh appetizers for your celebration.",
  ];

  const cleanDangling = (str: string): string => {
    let s = str.replace(/[,;:\-\s!.]+$/, "").trim();
    s = s.replace(/\s+\b(and|in|on|with|for|or|but|from|to|of)\b$/i, "").trim();
    return s.replace(/[,;:\-\s!.]+$/, "").trim();
  };

  // Long product names leave less room for a description and delivery suffix.
  // Use the short suffix for those names.
  const isLongName = cleanName.length >= 35;

  // Step 1: Try the full suffix for short and medium names.
  if (!isLongName) {
    if (cleanDesc && cleanDesc.length >= 15) {
      for (const p of prefixes) {
        const budget = maxLen - p.length - suffixPrimary.length;
        if (budget >= 15) {
          let sub = cleanDangling(truncateToWord(cleanDesc, budget));
          if (sub) {
            if (!sub.endsWith(".")) sub += ".";
            const cand = `${p}${sub}${suffixPrimary}`;
            if (cand.length >= 140 && cand.length <= maxLen) {
              return cand;
            }
          }
        }
      }
    }

    for (const p of prefixes) {
      for (const m of defaultMiddles) {
        const cand = `${p}${m}${suffixPrimary}`;
        if (cand.length >= 140 && cand.length <= maxLen) {
          return cand;
        }
      }
    }
  }

  // Step 2: Switch to the short suffix when the full version does not fit.
  // Use suffixShort for a more compact delivery phrase.
  if (cleanDesc && cleanDesc.length >= 15) {
    for (const p of prefixes) {
      const budget = maxLen - p.length - suffixShort.length;
      if (budget >= 10) {
        let sub = cleanDangling(truncateToWord(cleanDesc, budget));
        if (sub) {
          if (!sub.endsWith(".")) sub += ".";
          const cand = `${p}${sub}${suffixShort}`;
          if (cand.length >= 135 && cand.length <= maxLen) {
            return cand;
          }
        }
      }
    }
  }

  for (const p of prefixes) {
    for (const m of defaultMiddles) {
      const cand = `${p}${m}${suffixShort}`;
      if (cand.length >= 135 && cand.length <= maxLen) {
        return cand;
      }
    }
  }

  // Step 3: Fit the result precisely to maxLen.
  for (const s of [suffixShort, suffixPrimary]) {
    for (const p of prefixes) {
      const targetMid = maxLen - p.length - s.length - 2;
      if (targetMid >= 10) {
        const source = (cleanDesc && cleanDesc.length >= targetMid) ? cleanDesc : defaultMiddles[0];
        let trimmed = cleanDangling(truncateToWord(source, targetMid));
        if (trimmed) {
          if (!trimmed.endsWith(".")) trimmed += ".";
          const cand = `${p}${trimmed}${s}`;
          if (cand.length <= maxLen) {
            return cand;
          }
        }
      }
    }
  }

  // Fallback.
  const fallback = `«${cleanName}» from Chef Meal Catering. Fresh dishes.${suffixShort}`;
  return fallback.slice(0, maxLen);
};

export interface ProductAltParams {
  name?: string;
  extraInfo?: Array<{ amount?: number | string | null; unit?: string | null }>;
  selectedOptionName?: string;
  categoryName?: string;
  sectionName?: string;
  city?: string;
  companyName?: string;
}

/**
 * Generate descriptive image alt text for dishes and platters.
 *
 * Structure:
 * 1. Product name plus selected option, weight or quantity.
 * 2. A short description of the dish type and delivery area.
 *
 * Keep alternative text concise and useful.
 */
export const getProductAltText = (
  product?: {
    name?: string;
    extraInfo?: Array<{ amount?: number | string | null; unit?: string | null }>;
    selectedOption?: { name?: string | null };
  } | string | null,
  optionOrParams?: string | Partial<ProductAltParams>
): string => {
  const brand = "Chef Meal Catering";
  const city = "in Naberezhnye Chelny";

  if (!product) {
    return `Buffet dish - catering delivery ${city} by ${brand}`;
  }

  const rawName = typeof product === "string" ? product : product.name || "";
  const cleanName = rawName.replace(/[\u{1F300}-\u{1FAFF}]/gu, "").trim();
  if (!cleanName) {
    return `Buffet dish - catering delivery ${city} by ${brand}`;
  }

  // Extract the selected option or weight and quantity details.
  let detail = "";
  if (typeof optionOrParams === "string" && optionOrParams.trim()) {
    detail = optionOrParams.trim();
  } else if (typeof optionOrParams === "object" && optionOrParams?.selectedOptionName?.trim()) {
    detail = optionOrParams.selectedOptionName.trim();
  } else if (typeof product === "object" && product.selectedOption?.name?.trim()) {
    detail = product.selectedOption.name.trim();
  } else if (typeof product === "object" && Array.isArray(product.extraInfo) && product.extraInfo.length > 0) {
    const parts = product.extraInfo
      .map((item) => {
        const amt = item.amount !== undefined && item.amount !== null ? String(item.amount).trim() : "";
        const unt = item.unit ? item.unit.trim() : "";
        return amt && unt ? `${amt} ${unt}` : amt || unt;
      })
      .filter(Boolean);
    if (parts.length > 0) {
      detail = parts.join(", ");
    }
  }

  const isSetOrBox = /set|platter|box|assortment|basket|\u0441\u0435\u0442|\u043d\u0430\u0431\u043e\u0440|\u0431\u043e\u043a\u0441|\u0430\u0441\u0441\u043e\u0440\u0442\u0438|\u043f\u043b\u0430\u0442\u043e|\u043a\u043e\u0440\u0437\u0438\u043d/i.test(cleanName);
  const dishType = isSetOrBox ? "ready-made platters" : "buffet dishes";

  if (detail) {
    return `«${cleanName}» (${detail}) - delivery of ${dishType} ${city} by ${brand}`;
  }

  return `«${cleanName}» - catering and delivery of ${dishType} ${city} by ${brand}`;
};

export const buildProductAltText = getProductAltText;

/**
 * Generate alternative text for catalog section images.
 *
 * Include the section name, food type and delivery area.
 */
export const getSectionAltText = (sectionName?: string): string => {
  const brand = "Chef Meal Catering";
  const city = "in Naberezhnye Chelny";

  if (!sectionName || !sectionName.trim()) {
    return `Catering food catalog with delivery ${city} by ${brand}`;
  }

  const clean = sectionName.replace(/[\u{1F300}-\u{1FAFF}]/gu, "").trim();
  return `Section “${clean}” - buffet food and catering catalog ${city} by ${brand}`;
};

export const buildSectionAltText = getSectionAltText;

/**
 * Convert relative or internal media URLs
 * to public absolute URLs for Open Graph and Twitter Cards.
 */
export const toPublicMediaUrl = (
  url?: string | null,
  fallbackDomain = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
): string => {
  if (!url || !url.trim()) return "";
  let cleanUrl = url
    .trim()
    .replace(/^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?/, fallbackDomain);
  if (cleanUrl.startsWith("/")) {
    cleanUrl = `${fallbackDomain}${cleanUrl}`;
  }
  return cleanUrl;
};
