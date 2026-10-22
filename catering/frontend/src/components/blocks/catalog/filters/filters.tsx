import { useMobile } from "@/hooks/useMobile";
import styles from "./filters.module.scss";
import { FloatingFilter } from "./floating-filter";

export interface Category {
  id: string;
  name: string;
}

interface FiltersProps {
  categories: Category[];
  activeCategoryId: string;
  onCategoryChange: (id: string) => void;
}

const IS_AUTOSCROLL_TO_PRODUCTS_ENABLED = true;

export const Filters = ({
  categories,
  activeCategoryId,
  onCategoryChange,
}: FiltersProps) => {
  const isMobile = useMobile();

  const handleCategoryClick = (categoryId: string) => {
    onCategoryChange(categoryId);

    if (!IS_AUTOSCROLL_TO_PRODUCTS_ENABLED || !isMobile) return;
    // Smooth scroll so the bottom of the filters block aligns with the bottom of the sticky header
    setTimeout(() => {
      const container = document.getElementById("catalog-filters");
      if (container) {
        const header = document.querySelector("header");
        const headerHeight = header ? header.getBoundingClientRect().height : (window.innerWidth <= 768 ? 56 : 74);

        const containerRect = container.getBoundingClientRect();
        const containerBottom = containerRect.bottom + window.scrollY;

        // Scroll so the bottom of the filters container is exactly at the bottom of the sticky header
        const targetScrollY = containerBottom - headerHeight;

        window.scrollTo({
          top: targetScrollY,
          behavior: "smooth",
        });
      }
    }, 50);
  };

  return (
    <>
      <div id="catalog-filters" className={styles.filtersContainer}>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`${styles.filterButton} ${activeCategoryId === category.id ? styles.active : ""}`}
            onClick={() => handleCategoryClick(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
      <FloatingFilter />
    </>
  );
};

