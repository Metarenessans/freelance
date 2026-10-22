"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import styles from "./section-catalog.module.scss";
import { Product } from "@/components/blocks/catalog/product/product";
import { useAppActions } from "@/context/app-context";
import { SectionFilters } from "./filters/section-filters";
import { FloatingFilter } from "@/components/blocks/catalog/filters/floating-filter";
import {
  useGetSectionsQuery,
  useGetCategoriesQuery,
  useGetProductsQuery,
  type Section,
  type Category,
  type Product as ProductType,
} from "@/store/services/catalogApi";
import { SectionTitle } from "@/components/common/section-title/section-title";
import { CatalogSkeleton } from "@/components/blocks/catalog/skeleton/skeleton";
import { Breadcrumbs } from "@/components/common/breadcrumbs/breadcrumbs";

interface SectionCatalogProps {
  sectionSlug: string;
  subtitle?: string;
  initialSections?: Section[];
  initialCategories?: Category[];
  initialProducts?: ProductType[];
}

export const SectionCatalog = ({
  sectionSlug,
  subtitle,
  initialSections,
  initialCategories,
  initialProducts,
}: SectionCatalogProps) => {
  const { addToCart } = useAppActions();
  const [activeCategoryId, setActiveCategoryId] = useState<string>("");
  const isUserClickingRef = useRef(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: apiSections, isLoading: isLoadingSections } = useGetSectionsQuery(
    undefined,
    { skip: Boolean(initialSections?.length) }
  );
  const { data: apiCategories, isLoading: isLoadingCategories } = useGetCategoriesQuery(
    undefined,
    { skip: Boolean(initialCategories?.length) }
  );
  const { data: apiProducts, isLoading: isLoadingProducts } = useGetProductsQuery(
    {},
    { skip: Boolean(initialProducts?.length) }
  );

  const sections = apiSections || initialSections;
  const categories = apiCategories || initialCategories;
  const products = apiProducts || initialProducts;

  const currentSection = useMemo(() => {
    return sections?.find((s) => s.id === sectionSlug);
  }, [sections, sectionSlug]);

  const rawCategories = categories || [];
  const sectionCategories = useMemo(() => {
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

  const categoryGroups = useMemo(() => {
    if (!sectionCategories.length || !products?.length) return [];
    return sectionCategories
      .map((cat) => {
        const catProducts = products.filter((p) => p.categoryId === cat.id);
        return {
          category: cat,
          products: catProducts,
        };
      })
      .filter((group) => group.products.length > 0);
  }, [sectionCategories, products]);

  // Default active category
  useEffect(() => {
    if (categoryGroups.length > 0 && !activeCategoryId) {
      setActiveCategoryId(categoryGroups[0].category.id);
    }
  }, [categoryGroups, activeCategoryId]);

  const getDynamicHeaderOffset = useCallback(() => {
    if (typeof window === "undefined") return 140;

    const isMobile = window.innerWidth <= 768;

    // 1. Header height.
    const headerEl = document.querySelector<HTMLElement>("header");
    const headerHeight =
      headerEl && headerEl.offsetHeight > 0
        ? headerEl.offsetHeight
        : isMobile
          ? 56
          : 66;

    // 2. Floating category bar height.
    const stickyBarEl =
      document.getElementById("section-sticky-bar") ||
      document.querySelector<HTMLElement>('[class*="stickyBarWrapper"]');
    const stickyInner =
      stickyBarEl?.querySelector<HTMLElement>('[class*="innerContainer"]') ||
      stickyBarEl;
    const stickyBarHeight =
      stickyInner && stickyInner.offsetHeight > 0
        ? stickyInner.offsetHeight
        : isMobile
          ? 72
          : 62;

    // 3. Add spacing so the category heading remains fully visible below the bar.
    const extraGap = isMobile ? 14 : 18;

    return headerHeight + stickyBarHeight + extraGap;
  }, []);

  // ScrollSpy: Update active category as user scrolls through vertical sections
  useEffect(() => {
    if (categoryGroups.length === 0) return;

    const handleScroll = () => {
      if (isUserClickingRef.current) return;

      const offset = getDynamicHeaderOffset();
      const scrollY = window.scrollY;

      let currentId = categoryGroups[0].category.id;

      for (const group of categoryGroups) {
        const el = document.getElementById(`category-${group.category.id}`);
        if (el) {
          const top = el.getBoundingClientRect().top + scrollY - offset - 10;
          if (scrollY >= top) {
            currentId = group.category.id;
          }
        }
      }

      setActiveCategoryId(currentId);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categoryGroups, getDynamicHeaderOffset]);

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    isUserClickingRef.current = true;

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    const targetEl = document.getElementById(`category-${categoryId}`);
    if (targetEl) {
      const offset = getDynamicHeaderOffset();
      const targetY =
        targetEl.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: "smooth",
      });
    }

    clickTimeoutRef.current = setTimeout(() => {
      isUserClickingRef.current = false;
    }, 800);
  };

  const handleScrollToTop = () => {
    isUserClickingRef.current = true;
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    if (categoryGroups.length > 0) {
      setActiveCategoryId(categoryGroups[0].category.id);
    }

    clickTimeoutRef.current = setTimeout(() => {
      isUserClickingRef.current = false;
    }, 800);
  };

  const hasInitialData =
    Boolean(initialSections?.length && initialCategories?.length && initialProducts?.length);
  const isLoading =
    (isLoadingSections || isLoadingCategories || isLoadingProducts) && !hasInitialData;

  const hasMultipleCategories =
    !isLoading && sectionCategories.length > 1 && categoryGroups.length > 1;

  const defaultSubtitle = hasMultipleCategories
    ? "Choose a category below to jump to the dishes you want"
    : undefined;

  const effectiveSubtitle =
    subtitle !== undefined ? subtitle : defaultSubtitle;

  return (
    <section className={styles.catalogSection} id="catalog">
      <div className={styles.titleRow}>
        <div className={styles.breadcrumbsWrapper}>
          <Breadcrumbs
            items={[
              { name: "Home", url: "/" },
              { name: "Catalog", url: "/#sections" },
              { name: currentSection?.name || "Buffet menu" },
            ]}
          />
        </div>
        <SectionTitle as="h1">{currentSection?.name || "Buffet menu"}</SectionTitle>
      </div>

      {effectiveSubtitle && (
        <p className={styles.catalogSubtitle}>{effectiveSubtitle}</p>
      )}

      {isLoading ? (
        <CatalogSkeleton />
      ) : (
        <>
          {categoryGroups.length > 0 ? (
            <>
              <SectionFilters
                categories={sectionCategories}
                activeCategoryId={activeCategoryId}
                onCategoryChange={handleCategoryClick}
                onScrollToTop={handleScrollToTop}
              />

              <div className={styles.categoriesFeed}>
                {categoryGroups.map(({ category, products }, catIndex) => (
                  <section
                    key={category.id}
                    id={`category-${category.id}`}
                    className={styles.categoryGroup}
                  >
                    <div className={styles.categoryHeader}>
                      <h2 className={styles.categoryTitle}>{category.name}</h2>
                    </div>

                    <div className={styles.productGrid}>
                      {products.map((product, pIndex) => (
                        <div key={product.id} className={styles.itemWrapper}>
                          <Product
                            data={product}
                            priority={catIndex === 0 && pIndex < 2}
                            onAddToCart={(data) => addToCart(data)}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <h3>No categories found</h3>
              <p>This section has no products yet. Add categories and products in the admin panel.</p>
            </div>
          )}
          <FloatingFilter text="back to top" scrollToTop={true} />
        </>
      )}
    </section>
  );
};
