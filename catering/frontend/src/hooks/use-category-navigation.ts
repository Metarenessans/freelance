import { useCallback } from 'react';

export const useCategoryNavigation = () => {
  const navigateToCategory = useCallback((categoryId?: string, targetId: string = "catalog") => {
    // 1. Select category if provided
    if (categoryId) {
      const event = new CustomEvent("selectCategory", { detail: categoryId });
      window.dispatchEvent(event);
    }

    // 2. Scroll to target element (with a small timeout to ensure layout stability on iOS/Mobile)
    setTimeout(() => {
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        const headerOffset = window.innerWidth <= 768 ? 70 : 85;
        const elementPosition = targetSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }, 50);
  }, []);

  const handleCategoryClick = useCallback((e: React.MouseEvent, categoryId?: string, targetId: string = "catalog") => {
    e.preventDefault();
    navigateToCategory(categoryId, targetId);
  }, [navigateToCategory]);

  return { navigateToCategory, handleCategoryClick };
};
