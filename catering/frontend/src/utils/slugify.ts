export const slugify = (text: string): string => {
  if (!text) return "";
  const ru: Record<string, string> = {
    \u0430: "a", \u0431: "b", \u0432: "v", \u0433: "g", \u0434: "d", \u0435: "e", \u0451: "yo", \u0436: "zh",
    \u0437: "z", \u0438: "i", \u0439: "y", \u043a: "k", \u043b: "l", \u043c: "m", \u043d: "n", \u043e: "o",
    \u043f: "p", \u0440: "r", \u0441: "s", \u0442: "t", \u0443: "u", \u0444: "f", \u0445: "kh", \u0446: "ts",
    \u0447: "ch", \u0448: "sh", \u0449: "shch", \u044a: "", \u044b: "y", \u044c: "", \u044d: "e", \u044e: "yu",
    \u044f: "ya",
  };

  return text
    .toLowerCase()
    .split("")
    .map((char) => ru[char] || char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const getProductPopupSlug = (product: { id: string; name: string; slug?: string }): string => {
  return product.slug || slugify(product.name);
};

export const matchProductBySlug = <T extends { id: string; name: string; slug?: string }>(
  slug: string,
  products: T[]
): T | undefined => {
  if (!slug || !products || products.length === 0) return undefined;
  const cleanSlug = decodeURIComponent(slug)
    .toLowerCase()
    .trim()
    .replace(/^#/, "")
    .replace(/^popup\/product\//, "")
    .replace(/^\/popup\/product\//, "")
    .replace(/^\/product\//, "")
    .replace(/^product\//, "")
    .replace(/\/$/, "");

  // 1. Match by exact backend slug (from database)
  const byBackendSlug = products.find(
    (p) => p.slug && p.slug.toLowerCase() === cleanSlug
  );
  if (byBackendSlug) return byBackendSlug;

  // 2. Match by clean name slug (like Dodo: /product/flatwhite)
  const byNameSlug = products.find(
    (p) => slugify(p.name) === cleanSlug
  );
  if (byNameSlug) return byNameSlug;

  // 2. Match by getProductPopupSlug
  const byPopupSlug = products.find(
    (p) => getProductPopupSlug(p) === cleanSlug
  );
  if (byPopupSlug) return byPopupSlug;

  // 3. Backward compatibility: match old slug-id format (e.g., /product/name-102)
  const byEndId = products.find((p) => {
    const pId = String(p.id).toLowerCase();
    const nameSlug = slugify(p.name);
    return (
      cleanSlug === `${nameSlug}-${pId}` ||
      cleanSlug.endsWith(`-${pId}`) ||
      cleanSlug.split("-").pop() === pId
    );
  });
  if (byEndId) return byEndId;

  // 4. Match by direct numeric/string ID (e.g., /product/102)
  const byId = products.find((p) => String(p.id).toLowerCase() === cleanSlug);
  if (byId) return byId;

  return undefined;
};
