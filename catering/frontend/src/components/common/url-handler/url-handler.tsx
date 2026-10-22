"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppActions } from "@/context/app-context";
import { useGetCategoriesQuery, useGetProductsQuery } from "@/store/services/catalogApi";
import { matchProductBySlug } from "@/utils/slugify";

const UrlHandlerInner = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setMenuPopupOpen, setCartOpen, openProductModal, closeProductModal } = useAppActions();

  const hasCategoryParam = Boolean(searchParams.get("category"));
  const hasProductInUrl =
    typeof window !== "undefined"
      ? window.location.pathname.startsWith("/product/") ||
        window.location.hash.includes("product/") ||
        Boolean(searchParams.get("product"))
      : false;

  const { data: categories, isLoading: isLoadingCategories } = useGetCategoriesQuery(undefined, {
    skip: !hasCategoryParam,
  });
  const { data: products, isLoading: isLoadingProducts } = useGetProductsQuery({}, {
    skip: !hasProductInUrl,
  });

  // 1. Handle direct /cart or /calculate paths and menu planner query parameters.
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.location.pathname === "/cart") {
        setCartOpen(true);
      }
    }

    const menuKeys = ["menu", "popup", "action", "match-menu"];
    let foundMenuParam = null;

    for (const key of menuKeys) {
      const val = searchParams.get(key);
      if (val && (val === "open" || val === "1" || val === "menu" || val === "match-menu" || val === "true")) {
        foundMenuParam = key;
        break;
      }
    }

    if (foundMenuParam) {
      setMenuPopupOpen(true);

      // Clean up search params
      const newParams = new URLSearchParams(searchParams.toString());
      for (const key of menuKeys) {
        newParams.delete(key);
      }
      const newUrl = window.location.pathname + (newParams.toString() ? `?${newParams.toString()}` : "");
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, setMenuPopupOpen, setCartOpen, router]);

  // 2. Handle Category Selection and Scroll to Catalog
  useEffect(() => {
    if (isLoadingCategories || isLoadingProducts || !categories || categories.length === 0) return;

    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      const exists = categories.some((c) => c.id === categoryParam);
      if (exists) {
        // Select category by dispatching CustomEvent
        const event = new CustomEvent("selectCategory", { detail: categoryParam });
        window.dispatchEvent(event);

        // Scroll to catalog section
        setTimeout(() => {
          const targetSection = document.getElementById("catalog");
          if (targetSection) {
            const headerOffset = window.innerWidth <= 768 ? 70 : 85;
            const elementPosition = targetSection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth",
            });
          }
        }, 150);
      }

      // Clean up search params (always delete it to avoid infinite loops even if category doesn't match)
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("category");
      const newUrl = window.location.pathname + (newParams.toString() ? `?${newParams.toString()}` : "");
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, categories, isLoadingCategories, isLoadingProducts, router]);

  // 3. Open product on direct URL landing
  useEffect(() => {
    if (isLoadingProducts || !products || products.length === 0) return;
    if (typeof window === "undefined") return;

    const pathname = window.location.pathname;
    const hash = window.location.hash;
    let targetSlug: string | null = null;

    if (pathname.startsWith("/product/")) {
      targetSlug = pathname.replace(/^\/product\//, "").replace(/\/$/, "");
    } else if (hash.startsWith("#popup/product/")) {
      targetSlug = hash.replace("#popup/product/", "");
    } else if (hash.startsWith("#product/")) {
      targetSlug = hash.replace("#product/", "");
    } else {
      const productParam = searchParams.get("product");
      if (productParam) {
        targetSlug = productParam;
      }
    }

    if (targetSlug) {
      const found = matchProductBySlug(targetSlug, products);
      if (found) {
        openProductModal(found);
      }
    }
  }, [products, isLoadingProducts, searchParams, openProductModal]);

  // 4. Handle browser back/forward navigation (popstate / hashchange)
  useEffect(() => {
    const handleHashOrPopState = () => {
      if (typeof window === "undefined") return;
      const pathname = window.location.pathname;
      const hash = window.location.hash;

      if (pathname === "/cart" || hash === "#cart") {
        setCartOpen(true);
        setMenuPopupOpen(false);
        closeProductModal();
        return;
      }

      if (pathname === "/calculate") {
        setMenuPopupOpen(false);
        setCartOpen(false);
        closeProductModal();
        return;
      }

      if (hash === "#calculate") {
        setMenuPopupOpen(true);
        setCartOpen(false);
        closeProductModal();
        return;
      }

      if (pathname.startsWith("/product/")) {
        setCartOpen(false);
        setMenuPopupOpen(false);
        if (products && products.length > 0) {
          const target = pathname.replace(/^\/product\//, "").replace(/\/$/, "");
          const found = matchProductBySlug(target, products);
          if (found) {
            openProductModal(found);
            return;
          }
        }
        return;
      }

      if (hash.startsWith("#popup/product/") || hash.startsWith("#product/")) {
        setCartOpen(false);
        setMenuPopupOpen(false);
        if (products && products.length > 0) {
          const target = hash.replace(/^#(popup\/)?product\//, "");
          const found = matchProductBySlug(target, products);
          if (found) {
            openProductModal(found);
            return;
          }
        }
        return;
      }

      // If URL no longer points to any modal (e.g. user hit Back in browser)
      setCartOpen(false);
      setMenuPopupOpen(false);
      closeProductModal();
    };

    window.addEventListener("popstate", handleHashOrPopState);
    window.addEventListener("hashchange", handleHashOrPopState);

    return () => {
      window.removeEventListener("popstate", handleHashOrPopState);
      window.removeEventListener("hashchange", handleHashOrPopState);
    };
  }, [products, openProductModal, closeProductModal, setCartOpen, setMenuPopupOpen]);

  return null;
};

export const UrlHandler = () => {
  return (
    <Suspense fallback={null}>
      <UrlHandlerInner />
    </Suspense>
  );
};


