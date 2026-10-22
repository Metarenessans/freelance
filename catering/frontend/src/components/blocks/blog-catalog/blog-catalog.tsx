"use client";

import type { SimpleBlogArticle } from "@/store/services/blogApi";
import { Breadcrumbs } from "@/components/common/breadcrumbs/breadcrumbs";
import { BlogCard } from "./blog-card";
import styles from "./blog-catalog.module.scss";

interface BlogCatalogProps {
  articles: readonly SimpleBlogArticle[];
}

export function BlogCatalog({ articles }: BlogCatalogProps) {
  const sortedArticles = [...articles].sort((a, b) => {
    const dateA = new Date(a.created_date || 0).getTime();
    const dateB = new Date(b.created_date || 0).getTime();
    if (dateA !== dateB) {
      return dateB - dateA;
    }
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeB - timeA;
  });

  return (
    <section aria-labelledby="blog-title" className={styles.catalog}>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Blog" },
        ]}
        className={styles.breadcrumbs}
      />

      <div className={styles.titlePanel}>
        <h1 id="blog-title" className={styles.title}>
          Blog and guides
        </h1>
        <p className={styles.subtitle}>
          Chef tips for a perfect buffet: portions per guest, table settings and banquet platters
        </p>
      </div>

      {sortedArticles.length > 0 ? (
        <div className={styles.grid}>
          {sortedArticles.map((article, index) => (
            <BlogCard
              article={article}
              key={article.id || article.slug}
              priority={index < 3}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h3>Articles are on the way</h3>
          <p>Check back soon for practical guides to choosing dishes and planning catering.</p>
        </div>
      )}

    </section>
  );
}
