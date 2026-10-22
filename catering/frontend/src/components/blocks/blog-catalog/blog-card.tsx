import Link from "next/link";
import { Image } from "@/components/common/image/image";
import { toPublicMediaUrl } from "@/utils/seo";
import type { SimpleBlogArticle } from "@/store/services/blogApi";
import styles from "./blog-catalog.module.scss";

interface BlogCardProps {
  article: SimpleBlogArticle;
  priority?: boolean;
}

export function BlogCard({ article, priority }: BlogCardProps) {
  const coverUrl = toPublicMediaUrl(article.cover);

  const formattedDate = article.created_date
    ? article.created_date.split("-").reverse().join(".")
    : "";

  const altText =
    article.cover_alt || `Article cover: «${article.title}»`;

  return (
    <article className={styles.articleCard}>
      <Link className={styles.articleLink} href={`/blog/${article.slug}`}>
        {coverUrl ? (
          <div className={styles.poster}>
            <Image
              src={coverUrl}
              alt={altText}
              priority={priority}
              wrapperClassName={styles.imageWrapper}
              className={styles.cardImage}
            />
          </div>
        ) : (
          <div className={styles.posterPlaceholder}>
            <span className={styles.placeholderText}>Chef Meal Catering</span>
          </div>
        )}
        <div className={styles.articleContent}>
          <h2 className={styles.articleTitle}>{article.title}</h2>
          <div className={styles.articleFooter}>
            {article.created_date && (
              <time className={styles.articleDate} dateTime={article.created_date}>
                <span className={styles.dot} />
                {formattedDate}
              </time>
            )}
            <span className={styles.readMore}>
              <span>Read</span>
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
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
