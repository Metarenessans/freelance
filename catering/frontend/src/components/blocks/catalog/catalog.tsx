"use client";

import Link from "next/link";
import styles from "./catalog.module.scss";
import { Product, ProductData } from "./product/product";
import { useAppActions } from "@/context/app-context";
import { useState, useMemo, useEffect, useRef } from "react";
import { Filters } from "./filters/filters";
import { Virtuoso } from "react-virtuoso";
import { useMobile } from "@/hooks/useMobile";
import {
  useGetSectionsQuery,
  useGetCategoriesQuery,
  useGetProductsQuery,
} from "@/store/services/catalogApi";

import { SectionTitle } from "@/components/common/section-title/section-title";
import { CatalogSkeleton } from "./skeleton/skeleton";
import { useCategoryNavigation } from "@/hooks/use-category-navigation";

export interface CatalogProps {
  products?: ProductData[];
  filters?: { name: string; id: string }[];
  sectionSlug?: string;
  title?: string;
  subtitle?: string;
  backHref?: string;
}

export const Catalog = ({
  products = [],
  filters = [],
  sectionSlug,
  title,
  subtitle,
  backHref,
}: CatalogProps) => {
  const { addToCart } = useAppActions();
  const { navigateToCategory } = useCategoryNavigation();
  const [activeCategoryId, setActiveCategoryId] = useState("vygodno");
  const isMobile = useMobile();
  const columns = isMobile ? 2 : 3;

  const { data: apiSections } = useGetSectionsQuery(undefined, {
    skip: !sectionSlug,
  });

  const currentSection = useMemo(() => {
    return sectionSlug ? apiSections?.find((s) => s.id === sectionSlug) : undefined;
  }, [apiSections, sectionSlug]);

  const effectiveSubtitle =
    subtitle !== undefined
      ? subtitle
      : !sectionSlug
        ? "Ready-made buffet platters, party food boxes and appetizers for your events"
        : undefined;

  const handleShowMore = () => {
    if (categories.length === 0) return;
    const currentIndex = categories.findIndex((c) => c.id === activeCategoryId);
    const nextIndex = (currentIndex + 1) % categories.length;
    const nextCategory = categories[nextIndex];
    if (nextCategory) {
      navigateToCategory(nextCategory.id, "catalog");
    }
  };

  // =========================================================================
  const FILTER_LOCALLY = true;

  const isInitialized = useRef(false);
  const categoriesLoadedRef = useRef(false);

  const queryParams = useMemo(() => {
    return FILTER_LOCALLY
      ? {}
      : (activeCategoryId !== "all" ? { category: activeCategoryId } : {});
  }, [activeCategoryId, FILTER_LOCALLY]);

  const {
    data: apiCategories,
    isLoading: isLoadingCategories,
    isFetching: isFetchingCategories,
    refetch: refetchCategories,
  } = useGetCategoriesQuery();
  const {
    data: apiProducts,
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts,
    refetch: refetchProducts,
  } = useGetProductsQuery(queryParams);

  const rawCategories = apiCategories || [];
  const categories = useMemo(() => {
    if (!sectionSlug) return rawCategories;
    if (!currentSection) return [];
    const allowedSlugs = currentSection.categories || [];

    const catMap = new Map(rawCategories.map((c) => [c.id, c]));
    const ordered: typeof rawCategories = [];

    // 1. Maintain the exact order defined in currentSection.categories
    for (const slug of allowedSlugs) {
      const cat = catMap.get(slug);
      if (cat) {
        ordered.push(cat);
      }
    }

    // 2. Fallback: append any category referencing this section not in allowedSlugs
    const seenIds = new Set(ordered.map((c) => c.id));
    for (const c of rawCategories) {
      if (
        !seenIds.has(c.id) &&
        (c.sectionId === sectionSlug || (c.sectionIds && c.sectionIds.includes(sectionSlug)))
      ) {
        ordered.push(c);
      }
    }

    return ordered;
  }, [rawCategories, currentSection, sectionSlug]);

  const currentProducts = apiProducts || [];

  useEffect(() => {
    if (isInitialized.current && activeCategoryId) {
      localStorage.setItem("catering_active_category", activeCategoryId);
    }
  }, [activeCategoryId]);

  // Reset the ref whenever the component mounts.
  useEffect(() => {
    categoriesLoadedRef.current = false;
    isInitialized.current = false;
  }, []);

  // Refetch when restoring the page from the back-forward cache.
  // event.persisted distinguishes a restored page from ordinary tab switching.
  // The Redux store may be empty or stale after the browser restores the page.
  // Ordinary tab switching does not trigger this recovery path.
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        // Page restored from bfcache: request fresh data.
        refetchCategories();
        refetchProducts();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [refetchCategories, refetchProducts]);

  useEffect(() => {
    if (isLoadingCategories || categoriesLoadedRef.current) return;

    if (categories && categories.length > 0) {
      categoriesLoadedRef.current = true;

      const params = new URLSearchParams(window.location.search);
      const catParam = params.get("category");

      if (catParam && categories.some(c => c.id === catParam)) {
        setActiveCategoryId(catParam);
      } else if (sectionSlug) {
        setActiveCategoryId(categories[0].id);
      } else {
        const savedCategory = localStorage.getItem("catering_active_category");
        if (savedCategory && categories.some(c => c.id === savedCategory)) {
          setActiveCategoryId(savedCategory);
        } else if (categories.some(c => c.id === "vygodno")) {
          setActiveCategoryId("vygodno");
        } else {
          setActiveCategoryId(categories[0].id);
        }
      }
      isInitialized.current = true;
    }
  }, [isLoadingCategories, categories, sectionSlug]);

  useEffect(() => {
    const handleCategorySelect = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setActiveCategoryId(customEvent.detail);
      }
    };
    window.addEventListener("selectCategory", handleCategorySelect);
    return () => window.removeEventListener("selectCategory", handleCategorySelect);
  }, []);

  const filteredProducts = useMemo(() => {
    const products = (FILTER_LOCALLY && activeCategoryId !== "all")
      ? currentProducts.filter((p) => p.categoryId === activeCategoryId)
      : currentProducts;

    // Group products into rows
    const rows: ProductData[][] = [];
    for (let i = 0; i < products.length; i += columns) {
      rows.push(products.slice(i, i + columns));
    }
    return rows;
  }, [activeCategoryId, columns, currentProducts, FILTER_LOCALLY]);

  return (
    <section className={styles.catalogSection} id="catalog">
      <div className={styles.titleRow}>
        {backHref && (
          <Link href={backHref} className={styles.backButton} aria-label="Back to menu sections">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
        )}
        <SectionTitle>{title || currentSection?.name || "Buffet menu"}</SectionTitle>
      </div>
      {effectiveSubtitle && (
        <p className={styles.catalogSubtitle}>{effectiveSubtitle}</p>
      )}
      {(isLoadingCategories || isLoadingProducts || isFetchingCategories || isFetchingProducts) ? (
        <CatalogSkeleton />
      ) : (
        <>
          {categories.length > 0 ? (
            <>
              <Filters
                categories={categories}
                activeCategoryId={activeCategoryId}
                onCategoryChange={setActiveCategoryId}
              />
              <div key={activeCategoryId} className={styles.catalogWrapper}>
                {filteredProducts.length > 0 ? (
                  <>
                    <Virtuoso
                      useWindowScroll
                      data={filteredProducts}
                      overscan={{ main: 1500, reverse: 1500 }}
                      itemContent={(index, rowProducts) => (
                        <div className={styles.catalog} style={{ minHeight: "auto" }}>
                          {rowProducts.map((product, idx) => (
                            <div key={product.id || idx} className={styles.itemWrapper}>
                              <Product
                                data={product}
                                onAddToCart={(data) => addToCart(data)}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    />
                    <div className={styles.showMoreContainer}>
                      <button className={styles.showMoreBtn} onClick={handleShowMore}>
                        Show more
                      </button>
                    </div>
                  </>
                ) : (
                  <div className={styles.emptyState}>
                    <h3>No products found</h3>
                    <p>There are no products in this category yet. Choose another category or check back later.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <h3>No categories found</h3>
              <p>This section has no categories yet. Add categories in the admin panel.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
};
