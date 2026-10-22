import { NextResponse } from "next/server";
import {
  getCachedProducts,
  getCachedCategories,
  getCachedCompanyInfo,
} from "@/components/common/json-ld/server-catalog-cache";
import type { Product, Category } from "@/store/services/catalogApi";

export const dynamic = "force-dynamic";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d} ${h}:${min}`;
}

export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");

  const [products, categories, companyInfo] = await Promise.all([
    getCachedProducts(),
    getCachedCategories(),
    getCachedCompanyInfo(),
  ]);

  const brandName =
    companyInfo?.companyName ||
    companyInfo?.legalName ||
    "Chef Meal Catering";

  // Map string category IDs to stable numeric IDs required by YML.
  const categoryIdMap = new Map<string, number>();
  let catIndex = 1;
  categories.forEach((cat: Category) => {
    if (!categoryIdMap.has(cat.id)) {
      categoryIdMap.set(cat.id, catIndex++);
    }
  });

  // Fallback for products with no matching category.
  const fallbackCategoryId = catIndex;

  const now = formatDate(new Date());

  const xmlParts: string[] = [];
  xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>');
  xmlParts.push(`<yml_catalog date="${now}">`);
  xmlParts.push("  <shop>");
  xmlParts.push(`    <name>${escapeXml(brandName)}</name>`);
  xmlParts.push(`    <company>${escapeXml(brandName)}</company>`);
  xmlParts.push(`    <url>${baseUrl}</url>`);
  xmlParts.push("    <currencies>");
  xmlParts.push('      <currency id="RUR" rate="1"/>');
  xmlParts.push("    </currencies>");

  // Categories.
  xmlParts.push("    <categories>");
  categories.forEach((cat: Category) => {
    const numId = categoryIdMap.get(cat.id);
    if (numId) {
      xmlParts.push(
        `      <category id="${numId}">${escapeXml(cat.name)}</category>`
      );
    }
  });
  if (!categories.length) {
    xmlParts.push(
      `      <category id="${fallbackCategoryId}">All dishes</category>`
    );
  }
  xmlParts.push("    </categories>");

  // Product offers.
  xmlParts.push("    <offers>");

  products.forEach((product: Product, pIdx: number) => {
    const offerId = product.id || String(pIdx + 1);
    const catId = categoryIdMap.get(product.categoryId) || fallbackCategoryId;
    const productUrl = `${baseUrl}/product/${product.slug || product.id}`;

    // Calculate price.
    let price = product.priceInfo?.price || 0;
    if (price <= 0 && product.options && product.options.length > 0) {
      const minOpt = product.options.reduce((prev, curr) =>
        curr.price < prev.price ? curr : prev
      );
      price = minOpt.price;
    }
    const oldPrice = product.priceInfo?.oldPrice;

    // Normalize the image URL.
    let pictureUrl = "";
    if (product.imageUrl) {
      if (product.imageUrl.startsWith("http")) {
        pictureUrl = product.imageUrl.replace(
          /^http:\/\/127\.0\.0\.1:8000/,
          baseUrl
        );
      } else {
        pictureUrl = `${baseUrl}${
          product.imageUrl.startsWith("/") ? "" : "/"
        }${product.imageUrl}`;
      }
    }

    xmlParts.push(`      <offer id="${offerId}" available="true">`);
    xmlParts.push(`        <name>${escapeXml(product.name)}</name>`);
    xmlParts.push(`        <url>${productUrl}</url>`);
    xmlParts.push(`        <price>${Math.round(price)}</price>`);
    if (oldPrice && oldPrice > price) {
      xmlParts.push(`        <oldprice>${Math.round(oldPrice)}</oldprice>`);
    }
    xmlParts.push("        <currencyId>RUR</currencyId>");
    xmlParts.push(`        <categoryId>${catId}</categoryId>`);
    if (pictureUrl) {
      xmlParts.push(`        <picture>${escapeXml(pictureUrl)}</picture>`);
    }

    if (product.description) {
      xmlParts.push(
        `        <description><![CDATA[${product.description.trim()}]]></description>`
      );
    }

    // Parameters: weight, servings and quantity.
    if (Array.isArray(product.extraInfo) && product.extraInfo.length > 0) {
      product.extraInfo.forEach((item) => {
        if (item && item.amount && item.unit) {
          const paramName =
            item.unit.toLowerCase().includes("\u0433") ||
            item.unit.toLowerCase().includes("\u043a\u0433")
              ? "Weight"
              : item.unit.toLowerCase().includes("\u0448\u0442")
              ? "Quantity"
              : "Pack size";
          xmlParts.push(
            `        <param name="${paramName}">${item.amount} ${escapeXml(
              item.unit
            )}</param>`
          );
        }
      });
    }

    xmlParts.push("      </offer>");
  });

  xmlParts.push("    </offers>");
  xmlParts.push("  </shop>");
  xmlParts.push("</yml_catalog>");

  const xmlString = xmlParts.join("\n");

  return new NextResponse(xmlString, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
