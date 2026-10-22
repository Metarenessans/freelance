"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAppState, useAppActions } from "@/context/app-context";
import { ProductModal } from "./product-modal";
import { ProductData } from "@/components/blocks/catalog/product/product";
import { useGetProductsQuery } from "@/store/services/catalogApi";
import { buildProductTitle, buildProductDescription } from "@/utils/seo";
import { getProductPopupSlug } from "@/utils/slugify";

export const GlobalProductModal = () => {
  const { selectedProduct, productModalOptions } = useAppState();
  const { closeProductModal } = useAppActions();
  const [displayProduct, setDisplayProduct] = useState<ProductData | null>(null);
  const { data: products } = useGetProductsQuery({}, { skip: !selectedProduct });

  // Preserve the underlying page metadata before opening a product modal.
  const savedMetaRef = useRef<{
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    canonical: string;
  } | null>(null);

  useEffect(() => {
    if (selectedProduct) {
      if (products && products.length > 0) {
        const freshProduct = products.find((p) => String(p.id) === String(selectedProduct.id));
        if (freshProduct) {
          setDisplayProduct(freshProduct as ProductData);
          return;
        }
      }
      setDisplayProduct(selectedProduct);
    }
  }, [selectedProduct, products]);

  // Synchronize title, description and canonical URL when the modal opens or closes.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (productModalOptions?.skipUrlUpdate) return;

    if (selectedProduct) {
      const activeProduct = displayProduct || selectedProduct;
      const metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      const metaOgTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null;
      const metaOgDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null;
      const canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

      // Save the original page tags before displaying the product modal.
      if (!savedMetaRef.current) {
        const isDirectProductPath = window.location.pathname.startsWith("/product/");
        savedMetaRef.current = {
          title: isDirectProductPath
            ? "Chef Meal Catering | Buffet and catering delivery in Naberezhnye Chelny"
            : document.title,
          description: isDirectProductPath
            ? "Order catering, banquet dishes and buffet food for delivery in Naberezhnye Chelny. Delicious appetizers, bruschetta, canapes and ready-made party platters from Chef Meal Catering."
            : (metaDesc?.content || ""),
          ogTitle: metaOgTitle?.content || "",
          ogDescription: metaOgDesc?.content || "",
          canonical: isDirectProductPath
            ? "http://localhost:3000/"
            : (canonicalLink?.getAttribute("href") || window.location.href),
        };
      }

      const productTitle = buildProductTitle(activeProduct.name);
      const productDesc = buildProductDescription({
        name: activeProduct.name,
        description: activeProduct.description,
        maxLen: 165,
      });

      document.title = productTitle;

      if (metaDesc) {
        metaDesc.setAttribute("content", productDesc);
      } else {
        const newMeta = document.createElement("meta");
        newMeta.name = "description";
        newMeta.content = productDesc;
        document.head.appendChild(newMeta);
      }

      if (metaOgTitle) {
        metaOgTitle.setAttribute("content", productTitle);
      } else {
        const newOgTitle = document.createElement("meta");
        newOgTitle.setAttribute("property", "og:title");
        newOgTitle.content = productTitle;
        document.head.appendChild(newOgTitle);
      }

      if (metaOgDesc) {
        metaOgDesc.setAttribute("content", productDesc);
      } else {
        const newOgDesc = document.createElement("meta");
        newOgDesc.setAttribute("property", "og:description");
        newOgDesc.content = productDesc;
        document.head.appendChild(newOgDesc);
      }

      // Set the canonical URL to the currently open product.
      const slug = getProductPopupSlug(activeProduct);
      const productCanonical = `http://localhost:3000/product/${slug}`;
      if (canonicalLink) {
        canonicalLink.setAttribute("href", productCanonical);
      } else {
        const newLink = document.createElement("link");
        newLink.rel = "canonical";
        newLink.href = productCanonical;
        document.head.appendChild(newLink);
      }

    } else if (savedMetaRef.current) {
      // Restore the underlying page metadata when the modal closes.
      document.title = savedMetaRef.current.title;

      const metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (metaDesc) {
        metaDesc.setAttribute("content", savedMetaRef.current.description);
      }

      const metaOgTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null;
      if (metaOgTitle) {
        metaOgTitle.setAttribute("content", savedMetaRef.current.ogTitle);
      }

      const metaOgDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null;
      if (metaOgDesc) {
        metaOgDesc.setAttribute("content", savedMetaRef.current.ogDescription);
      }

      const canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (canonicalLink && savedMetaRef.current.canonical) {
        canonicalLink.setAttribute("href", savedMetaRef.current.canonical);
      }

      savedMetaRef.current = null;
    }
  }, [selectedProduct, displayProduct]);

  // Restore metadata on unmount, for example when navigating away.
  useEffect(() => {
    return () => {
      if (savedMetaRef.current && typeof document !== "undefined") {
        document.title = savedMetaRef.current.title;
        const metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
        if (metaDesc) {
          metaDesc.setAttribute("content", savedMetaRef.current.description);
        }
        const canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
        if (canonicalLink && savedMetaRef.current.canonical) {
          canonicalLink.setAttribute("href", savedMetaRef.current.canonical);
        }
      }
    };
  }, []);

  if (!displayProduct) return null;

  return (
    <ProductModal
      data={displayProduct}
      isOpen={!!selectedProduct}
      onClose={closeProductModal}
      showAddButton={productModalOptions?.showAddButton}
    />
  );
};
