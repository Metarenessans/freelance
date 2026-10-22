"use client";

import styles from "./section-filters.module.scss";
import { SectionStickyBar } from "./section-sticky-bar";

export interface Category {
  id: string;
  name: string;
}

interface SectionFiltersProps {
  categories: Category[];
  activeCategoryId: string;
  onCategoryChange: (id: string) => void;
  onScrollToTop?: () => void;
  onScrollToSections?: () => void;
}

export const SectionFilters = ({
  categories,
  activeCategoryId,
  onCategoryChange,
  onScrollToTop,
  onScrollToSections,
}: SectionFiltersProps) => {


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

  return (
    <>
      {categories.length > 1 ? (
        <div id="catalog-filters" className={styles.filtersContainer}>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`${styles.filterButton} ${activeCategoryId === category.id ? styles.active : ""}`}
              onClick={() => onCategoryChange(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      ) : (
        <div id="catalog-filters" className={styles.filtersAnchor} />
      )}
      <SectionStickyBar
        categories={categories}
        activeCategoryId={activeCategoryId}
        onCategoryChange={onCategoryChange}
        onScrollToTop={onScrollToTop}
        onScrollToSections={onScrollToSections}
      />
    </>
  );
};
