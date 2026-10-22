import React from "react";
import Link from "next/link";
import styles from "./breadcrumbs.module.scss";

export interface BreadcrumbItem {
  name: string;
  url?: string;
  seoName?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className = "",
}) => {
  if (!items || items.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumbs"
      className={`${styles.breadcrumbs} ${className}`.trim()}
    >
      <ol
        className={styles.list}
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li
              key={item.url || index}
              className={styles.item}
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {isLast || !item.url ? (
                <>
                  {item.seoName && (
                    <meta itemProp="name" content={item.seoName} />
                  )}
                  <span
                    className={styles.current}
                    aria-current="page"
                    {...(!item.seoName ? { itemProp: "name" } : {})}
                  >
                    {item.name}
                  </span>
                </>
              ) : (
                <Link
                  href={item.url}
                  className={styles.link}
                  itemProp="item"
                >
                  <span itemProp="name">{item.name}</span>
                </Link>
              )}
              <meta itemProp="position" content={String(index + 1)} />

              {!isLast && (
                <span className={styles.separator} aria-hidden="true">
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 12 10 8 6 4" />
                  </svg>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
