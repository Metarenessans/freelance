"use client";

import Link from "next/link";
import { Image } from "@/components/common/image/image";
import styles from "./sections.module.scss";
import { SectionTitle } from "@/components/common/section-title/section-title";
import { useGetSectionsQuery } from "@/store/services/catalogApi";
import { SectionsSkeleton } from "./skeleton/skeleton";
import { getSectionAltText } from "@/utils/seo";

import type { Section } from "@/store/services/catalogApi";

// Default fallback image if no image was uploaded for the section
const DEFAULT_SECTION_IMAGE =
  "/icon.svg";

export interface SectionsProps {
  excludeSlug?: string;
  title?: string;
  subtitle?: string;
  id?: string;
  hideIfEmpty?: boolean;
  initialSections?: Section[];
}

function formatCategoryCount(count?: number): string | null {
  if (!count || count <= 0) return null;
  return `${count} ${count === 1 ? "category" : "categories"}`;
}

export const Sections = ({
  excludeSlug,
  title = "Buffet menu",
  subtitle,
  id = "catalog",
  hideIfEmpty = Boolean(excludeSlug),
  initialSections,
}: SectionsProps) => {
  const { data: sections, isLoading: isQueryLoading, isFetching } = useGetSectionsQuery(
    undefined,
    { skip: Boolean(initialSections?.length) }
  );
  const effectiveSections = sections || initialSections;
  const isLoading = (isQueryLoading || isFetching) && (!effectiveSections || effectiveSections.length === 0);

  const effectiveSubtitle =
    subtitle !== undefined
      ? subtitle
      : !excludeSlug
        ? "Ready-made buffet platters, party food boxes and appetizers for your events"
        : undefined;

  if (isLoading) {
    return (
      <section className={styles.sectionsContainer} id={id}>
        <SectionTitle>{title}</SectionTitle>
        {effectiveSubtitle && (
          <p className={styles.sectionsSubtitle}>{effectiveSubtitle}</p>
        )}
        <SectionsSkeleton />
      </section>
    );
  }

  const rawItems = effectiveSections || [];
  const items = excludeSlug
    ? rawItems.filter((section) => section.id !== excludeSlug)
    : rawItems;

  if (items.length === 0 && hideIfEmpty) {
    return null;
  }

  return (
    <section className={styles.sectionsContainer} id={id}>
      <SectionTitle>{title}</SectionTitle>
      {effectiveSubtitle && (
        <p className={styles.sectionsSubtitle}>{effectiveSubtitle}</p>
      )}

      {items.length > 0 ? (
        <div className={styles.grid}>
          {items.map((section, index) => {
            const categoryCountText = formatCategoryCount(section.categories?.length);

            return (
              <Link
                key={section.id}
                href={`/catalog/${section.id}`}
                prefetch={true}
                className={styles.card}
                onClick={() => {
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem("main_page_scroll_pos", String(Math.round(window.scrollY)));
                    sessionStorage.setItem("from_main_page", "true");
                  }
                }}
              >
                <div className={styles.imageContainer}>
                  <Image
                    src={section.imageUrl || DEFAULT_SECTION_IMAGE}
                    alt={getSectionAltText(section.name)}
                    className={styles.image}
                    wrapperClassName={styles.imageWrapper}
                    priority={index < 4}
                  />
                </div>

                <div className={styles.info}>
                  <div className={styles.textGroup}>
                    <div className={styles.metaRow}>
                      <span className={styles.dot} />
                      <span className={styles.categoryCount}>
                        {categoryCountText || "Menu section"}
                      </span>
                    </div>
                    <h3 className={styles.title}>{section.name}</h3>
                  </div>

                  <div className={styles.actionBtn} aria-hidden="true">
                    <span className={styles.actionText}>View menu</span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={styles.arrowIcon}
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h3>No menu sections found</h3>
          <p>No menu sections are available yet. Please check back later.</p>
        </div>
      )}
    </section>
  );
};
