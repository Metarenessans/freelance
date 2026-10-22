"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./section-sticky-bar.module.scss";

export interface Category {
  id: string;
  name: string;
}

interface SectionStickyBarProps {
  categories: Category[];
  activeCategoryId: string;
  onCategoryChange: (id: string) => void;
  onScrollToTop?: () => void;
  onScrollToSections?: () => void;
}

export const SectionStickyBar = ({
  categories,
  activeCategoryId,
  onCategoryChange,
  onScrollToTop,
  onScrollToSections,
}: SectionStickyBarProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [bounds, setBounds] = useState<{ left: number; width: number } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeBtnRef = useRef<HTMLButtonElement | null>(null);

  const updateBounds = useCallback(() => {
    if (typeof window === "undefined" || window.innerWidth <= 768) {
      setBounds(null);
      return;
    }
    const catalogEl = document.getElementById("catalog");
    const wrapper =
      catalogEl?.querySelector<HTMLElement>('[class*="categoriesFeed"]') ||
      document.getElementById("catalog-filters");
    if (wrapper) {
      const rect = wrapper.getBoundingClientRect();
      if (rect.width > 0) {
        setBounds({ left: rect.left, width: rect.width });
      }
    }
  }, []);

  const checkScrollability = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    updateBounds();
    window.addEventListener("resize", updateBounds);
    window.addEventListener("scroll", updateBounds, { passive: true });
    return () => {
      window.removeEventListener("resize", updateBounds);
      window.removeEventListener("scroll", updateBounds);
    };
  }, [updateBounds, isVisible]);

  useEffect(() => {
    const catalogElement = document.getElementById("catalog");
    if (!catalogElement) return;

    const filtersElement =
      document.getElementById("catalog-filters") ||
      catalogElement.querySelector<HTMLElement>('[class*="titleRow"]') ||
      catalogElement;

    if (!filtersElement) return;

    let rafId: number | null = null;

    const checkVisibility = () => {
      const isHeaderHidden =
        document.documentElement.getAttribute("data-header-hidden") === "true";
      const headerOffset = isHeaderHidden
        ? 0
        : window.innerWidth <= 768
          ? 56
          : 66;

      const filtersRect = filtersElement.getBoundingClientRect();
      const catalogRect = catalogElement.getBoundingClientRect();

      // Center of the category filter block.
      const filtersMiddle = filtersRect.top + filtersRect.height / 2;

      // Show when the center of the category block moves under the header.
      // Hide when the user scrolls above the center of the block.
      const isPastMiddle = filtersMiddle <= headerOffset;
      const isCatalogInView = catalogRect.bottom > headerOffset + 60;
      const isAtTop = window.scrollY < 50;

      setIsVisible(isPastMiddle && isCatalogInView && !isAtTop);
    };

    const handleScrollOrResize = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        checkVisibility();
        rafId = null;
      });
    };

    // Initial check.
    checkVisibility();

    window.addEventListener("scroll", handleScrollOrResize, { passive: true });
    window.addEventListener("resize", handleScrollOrResize);

    // Watch the data-header-hidden attribute on the html element.
    const mutationObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === "data-header-hidden") {
          handleScrollOrResize();
          break;
        }
      }
    });
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-header-hidden"],
    });

    // Watch for content size changes.
    const resizeObserver = new ResizeObserver(() => {
      handleScrollOrResize();
    });
    resizeObserver.observe(filtersElement);
    resizeObserver.observe(catalogElement);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScrollOrResize);
      window.removeEventListener("resize", handleScrollOrResize);
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  // Update scroll buttons whenever visible, categories change, or resize
  useEffect(() => {
    checkScrollability();
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener("scroll", checkScrollability, { passive: true });
    window.addEventListener("resize", checkScrollability);

    return () => {
      el.removeEventListener("scroll", checkScrollability);
      window.removeEventListener("resize", checkScrollability);
    };
  }, [checkScrollability, categories, isVisible]);

  const isWheelActiveRef = useRef(false);
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Convert mouse wheel scrolling over category bar into fast horizontal scroll & prevent page scroll
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      if (delta !== 0) {
        e.preventDefault();

        if (!isWheelActiveRef.current) {
          isWheelActiveRef.current = true;
          el.style.scrollBehavior = "auto";
        }

        el.scrollLeft += delta;

        if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);

        wheelTimeoutRef.current = setTimeout(() => {
          isWheelActiveRef.current = false;
          el.style.scrollBehavior = "";
          checkScrollability();
        }, 150);
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
      if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
    };
  }, [checkScrollability]);

  // Center active category button inside the horizontal bar
  useEffect(() => {
    if (activeBtnRef.current && !isWheelActiveRef.current) {
      activeBtnRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeCategoryId, isVisible]);

  const scrollByAmount = (offset: number) => {
    scrollContainerRef.current?.scrollBy({ left: offset, behavior: "smooth" });
  };

  const handleCategoryClick = (categoryId: string) => {
    onCategoryChange(categoryId);
  };

  const handleScrollToTop = () => {
    if (onScrollToTop) {
      onScrollToTop();
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleScrollToSections = () => {
    if (onScrollToSections) {
      onScrollToSections();
    } else {
      const target =
        document.getElementById("other-sections") ||
        document.getElementById("catalog");
      if (target) {
        const headerOffset = window.innerWidth <= 768 ? 60 : 74;
        const targetY =
          target.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({
          top: targetY,
          behavior: "smooth",
        });
      }
    }
  };

  if (!categories || categories.length === 0) return null;

  return (
    <div
      id="section-sticky-bar"
      className={`${styles.stickyBarWrapper} ${isVisible ? styles.visible : ""}`}
      style={
        bounds
          ? {
            left: `${bounds.left}px`,
            width: `${bounds.width}px`,
            transform: isVisible ? "none" : "translateY(-120%)",
          }
          : undefined
      }
      aria-hidden={!isVisible}
    >
      <div className={styles.innerContainer}>
        {canScrollLeft && (
          <button
            type="button"
            className={`${styles.scrollBtn} ${styles.left}`}
            onClick={() => scrollByAmount(-220)}
            aria-label="Scroll left"
          >
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
          </button>
        )}

        <div ref={scrollContainerRef} className={styles.scrollContainer}>
          <button
            type="button"
            className={styles.filterButton}
            onClick={handleScrollToTop}
            aria-label="Back to top"
          >
            Back to top
          </button>

          {categories.map((category) => {
            const isActive = activeCategoryId === category.id;
            return (
              <button
                key={category.id}
                ref={isActive ? activeBtnRef : null}
                type="button"
                className={`${styles.filterButton} ${isActive ? styles.active : ""}`}
                onClick={() => handleCategoryClick(category.id)}
              >
                {category.name}
              </button>
            );
          })}

          <button
            type="button"
            className={styles.filterButton}
            onClick={handleScrollToSections}
            aria-label="Go to other menu sections"
          >
            To the menu
          </button>
        </div>

        {canScrollRight && (
          <button
            type="button"
            className={`${styles.scrollBtn} ${styles.right}`}
            onClick={() => scrollByAmount(220)}
            aria-label="Scroll right"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
