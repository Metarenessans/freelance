"use client";

import { useCallback, useEffect, useRef, useState, RefObject } from "react";
import styles from "./floating-filter.module.scss";
import { useAppState } from "@/context/app-context";

export interface FloatingFilterProps {
  text?: string;
  targetElementId?: string;
  targetRef?: RefObject<HTMLElement | null>;
  containerElementId?: string;
  scrollToTop?: boolean;
  onCustomScroll?: () => void;
}

export const FloatingFilter = ({
  text = "catalog",
  targetElementId = "catalog-filters",
  targetRef,
  containerElementId = "catalog",
  scrollToTop = false,
  onCustomScroll,
}: FloatingFilterProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const { cartItems } = useAppState();
  const hasCart = cartItems.length > 0;
  const filtersRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const catalogElement = document.getElementById(containerElementId);
    if (!catalogElement) return;

    const filtersElement =
      targetRef?.current ||
      document.getElementById(targetElementId) ||
      catalogElement.querySelector<HTMLElement>('[class*="filtersContainer"]') ||
      catalogElement.querySelector<HTMLElement>('[class*="titleRow"]') ||
      catalogElement;

    if (!filtersElement) return;

    filtersRef.current = filtersElement;

    let isFiltersPast = false;
    let isCatalogInView = false;
    let isAtTop = true;

    const updateVisibility = () => {
      setIsVisible(isFiltersPast && isCatalogInView && !isAtTop);
    };

    const filtersObserver = new IntersectionObserver(
      ([entry]) => {
        isFiltersPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        updateVisibility();
      },
      { threshold: 0 }
    );

    const catalogObserver = new IntersectionObserver(
      ([entry]) => {
        isCatalogInView = entry.isIntersecting;
        updateVisibility();
      },
      { threshold: 0 }
    );

    const sentinel = document.createElement("div");
    sentinel.style.cssText =
      "position:absolute;top:100px;left:0;width:1px;height:1px;pointer-events:none;";
    document.body.prepend(sentinel);

    const topObserver = new IntersectionObserver(
      ([entry]) => {
        isAtTop = entry.isIntersecting;
        updateVisibility();
      },
      { threshold: 0 }
    );

    filtersObserver.observe(filtersElement);
    catalogObserver.observe(catalogElement);
    topObserver.observe(sentinel);

    // Initial check
    const filtersRect = filtersElement.getBoundingClientRect();
    const catalogRect = catalogElement.getBoundingClientRect();
    isFiltersPast = filtersRect.bottom < 0;
    isCatalogInView =
      catalogRect.top < window.innerHeight && catalogRect.bottom > 0;
    isAtTop = window.scrollY < 100;
    updateVisibility();

    return () => {
      filtersObserver.disconnect();
      catalogObserver.disconnect();
      topObserver.disconnect();
      sentinel.remove();
    };
  }, [targetElementId, containerElementId, targetRef]);

  useEffect(() => {
    if (isVisible) {
      document.body.classList.add("has-floating-filter");
    } else {
      document.body.classList.remove("has-floating-filter");
    }

    return () => {
      document.body.classList.remove("has-floating-filter");
    };
  }, [isVisible]);

  const handleClick = useCallback(() => {
    if (onCustomScroll) {
      onCustomScroll();
      return;
    }

    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const filtersElement =
      filtersRef.current ||
      document.getElementById(targetElementId) ||
      (containerElementId ? document.getElementById(containerElementId) : null);
    if (!filtersElement) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Scroll to filters
    const yOffset = -100; // header height offset
    const y =
      filtersElement.getBoundingClientRect().top + window.scrollY + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });

    // Briefly highlight filters, then fully reset all inline styles
    filtersElement.style.transition =
      "background-color 0.3s ease, border-radius 0.3s ease";
    filtersElement.style.backgroundColor = "rgba(219, 73, 0, 0.2)";
    filtersElement.style.borderRadius = "14px";
    setTimeout(() => {
      filtersElement.style.backgroundColor = "";
      filtersElement.style.borderRadius = "";
      filtersElement.style.transition = "";
    }, 600);
  }, [scrollToTop, onCustomScroll, targetElementId, containerElementId]);

  return (
    <button
      type="button"
      className={`${styles.floatingFilter} ${isVisible ? styles.visible : ""} ${hasCart ? styles.hasCart : ""}`}
      onClick={handleClick}
      aria-label={text}
    >
      <span className={styles.text}>{text}</span>
      <div className={styles.iconWrapper}>
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </div>
    </button>
  );
};
