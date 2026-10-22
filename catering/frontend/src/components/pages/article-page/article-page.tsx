"use client";

import { TrustStandards } from "@/components/common/trust-standards";

import React from "react";
import Link from "next/link";
import { AppProvider, useAppActions } from "@/context/app-context";
import { Header } from "@/components/blocks/header";
import { Footer } from "@/components/blocks/footer/footer";
import { FloatingCart } from "@/components/common/cart/floating-cart";
import { GlobalProductModal } from "@/components/common/product-modal/global-product-modal";
import { GlobalCartModal } from "@/components/common/cart/global-cart-modal";
import { MenuPopup } from "@/components/common/menu-popup/menu-popup";
import { CartShareHandler } from "@/components/common/cart/cart-share-handler";
import { UrlHandler } from "@/components/common/url-handler/url-handler";
import { Image } from "@/components/common/image/image";
import { Product } from "@/components/blocks/catalog/product/product";
import { BlogCard } from "@/components/blocks/blog-catalog/blog-card";
import type { BlogArticle } from "@/store/services/blogApi";
import type { CompanyInfo, FooterNavItem } from "@/store/services/companyApi";
import { Breadcrumbs } from "@/components/common/breadcrumbs/breadcrumbs";
import { toPublicMediaUrl } from "@/utils/seo";
import styles from "./article-page.module.scss";

interface ArticlePageProps {
  article: BlogArticle;
  initialCompanyInfo?: CompanyInfo;
  initialFooterNav?: FooterNavItem[];
}

const BACKEND_URL =
  (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

function ArticleContent({ article }: { article: BlogArticle }) {
  const { addToCart } = useAppActions();

  const coverUrl = toPublicMediaUrl(article?.cover);

  const formattedDate = article?.created_date
    ? article.created_date.split("-").reverse().join(".")
    : "";

  const formatSourceLink = (link: string) => {
    if (!link) return "";
    try {
      let domain = link.replace(/^(https?:\/\/)?(www\.)?/, "");
      domain = domain.split("/")[0];
      return domain;
    } catch {
      return link;
    }
  };

  const renderFormattedText = (text: string): React.ReactNode => {
    if (!text) return null;
    // Convert markdown bold __text__ and **text** to <strong>text</strong>
    const htmlContent = text
      .replace(/__([\s\S]*?)__/g, "<strong>$1</strong>")
      .replace(/\*\*([\s\S]*?)\*\*/g, "<strong>$1</strong>");
    return <span dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  };

  return (
    <article className={styles.article}>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" },
          { name: "Article", seoName: article?.title || "Article" },
        ]}
        className={styles.breadcrumbs}
      />

      {article?.title && (
        <header className={styles.header}>
          <h1 className={styles.title}>{article.title}</h1>
          {article.created_date && (
            <time className={styles.date} dateTime={article.created_date}>
              {formattedDate}
            </time>
          )}
        </header>
      )}

      {coverUrl && (
        <div className={styles.coverWrapper}>
          <div
            className={
              article.is_cover_like_block_image
                ? styles.blockCover
                : styles.cover
            }
          >
            <Image
              src={coverUrl}
              alt={
                article.cover_alt || `Article cover: «${article.title}»`
              }
              priority={true}
              wrapperClassName={styles.coverImage}
            />
          </div>
          {article.cover_source_link && (
            <div className={styles.sourceLink}>
              <a
                href={
                  article.cover_source_link.startsWith("http")
                    ? article.cover_source_link
                    : `https://${article.cover_source_link}`
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                Source: {formatSourceLink(article.cover_source_link)}
              </a>
            </div>
          )}
        </div>
      )}

      {article?.blocks && article.blocks.length > 0 && (
        <div className={styles.content}>
          {article.blocks
            .slice()
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((block) => {
              const blockImageUrl = toPublicMediaUrl(block.image);

              return (
                <div key={block.id || block.order} className={styles.textBlock}>
                  {block.text && (() => {
                    const lines = block.text.split("\n");
                    const parsedBlocks: any[] = [];
                    let currentList: any[] = [];
                    let inAccent = false;
                    let accentLines: string[] = [];

                    const flushList = () => {
                      if (currentList.length > 0) {
                        parsedBlocks.push({
                          type: "list",
                          items: currentList,
                        });
                        currentList = [];
                      }
                    };

                    for (const rawLine of lines) {
                      const trimmed = rawLine.trim();

                      if (inAccent) {
                        accentLines.push(rawLine);
                        if (trimmed.endsWith("**")) {
                          inAccent = false;
                          const joined = accentLines.join("\n").trim();
                          const cleaned = joined
                            .replace(/^\*\*/, "")
                            .replace(/\*\*$/, "")
                            .trim();
                          parsedBlocks.push({
                            type: "accent",
                            text: cleaned,
                          });
                          accentLines = [];
                        }
                        continue;
                      }

                      if (trimmed === "") {
                        flushList();
                        continue;
                      }

                      const listMatch = trimmed.match(/^>\s*(\d+)\.?\s*(.*)/);
                      if (listMatch) {
                        currentList.push({
                          num: listMatch[1],
                          text: listMatch[2],
                        });
                        continue;
                      }

                      flushList();

                      if (trimmed.startsWith("**")) {
                        if (trimmed.endsWith("**") && trimmed.length > 4) {
                          parsedBlocks.push({
                            type: "accent",
                            text: trimmed.slice(2, -2).trim(),
                          });
                        } else {
                          inAccent = true;
                          accentLines = [rawLine];
                        }
                        continue;
                      }

                      if (
                        trimmed.startsWith("*") &&
                        trimmed.endsWith("*") &&
                        trimmed.length > 2
                      ) {
                        parsedBlocks.push({
                          type: "heading",
                          text: trimmed.slice(1, -1).trim(),
                        });
                        continue;
                      }

                      parsedBlocks.push({
                        type: "regular",
                        text: rawLine,
                      });
                    }

                    flushList();

                    if (inAccent && accentLines.length > 0) {
                      const joined = accentLines.join("\n").trim();
                      const cleaned = joined
                        .replace(/^\*\*/, "")
                        .replace(/\*\*$/, "")
                        .trim();
                      parsedBlocks.push({
                        type: "accent",
                        text: cleaned,
                      });
                    }

                    return (
                      <div>
                        {parsedBlocks.map((item, index) => {
                          if (item.type === "list") {
                            return (
                              <ul key={index} className={styles.listContainer}>
                                {item.items.map(
                                  (listItem: any, idx: number) => (
                                    <li key={idx} className={styles.listItem}>
                                      <span className={styles.listNumber}>
                                        {listItem.num}
                                      </span>
                                      <span className={styles.listText}>
                                        {renderFormattedText(listItem.text)}
                                      </span>
                                    </li>
                                  )
                                )}
                              </ul>
                            );
                          }
                          if (item.type === "accent") {
                            return (
                              <div key={index} className={styles.accentCard}>
                                <p>{renderFormattedText(item.text)}</p>
                              </div>
                            );
                          }
                          if (item.type === "heading") {
                            return (
                              <h2
                                key={index}
                                className={styles.headingBlock}
                              >
                                {renderFormattedText(item.text)}
                              </h2>
                            );
                          }
                          return (
                            <p key={index} className={styles.regularBlock}>
                              {renderFormattedText(item.text)}
                            </p>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {blockImageUrl && (
                    <div className={styles.blockImageWrapper}>
                      <div
                        className={
                          block.image_height_unlimited
                            ? styles.blockImageUnlimited
                            : styles.blockImageFixed
                        }
                      >
                        <Image
                          src={blockImageUrl}
                          alt={
                            block.image_alt ||
                            (article.title
                              ? `Illustration for: «${article.title}»`
                              : "")
                          }
                          wrapperClassName={styles.coverImage}
                        />
                      </div>
                      {block.image_source_link && (
                        <div className={styles.sourceLink}>
                          <a
                            href={
                              block.image_source_link.startsWith("http")
                                ? block.image_source_link
                                : `https://${block.image_source_link}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Source:{" "}
                            {formatSourceLink(block.image_source_link)}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Products featured in the article. */}
      {article.products && article.products.length > 0 && (
        <section className={styles.sectionBlock}>
          <h2 className={styles.sectionHeading}>Dishes and platters featured in this article</h2>
          <div className={styles.productsGrid}>
            {article.products.map((prod) => (
              <Product
                key={prod.id}
                data={prod}
                onAddToCart={(data) => addToCart(data)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Related articles. */}
      {article.related_articles && article.related_articles.length > 0 && (
        <section className={styles.sectionBlock}>
          <h2 className={styles.sectionHeading}>You may also like</h2>
          <div className={styles.relatedGrid}>
            {article.related_articles.map((item) => (
              <BlogCard key={item.id || item.slug} article={item} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

export function ArticlePage({
  article,
  initialCompanyInfo,
  initialFooterNav,
}: ArticlePageProps) {
  return (
    <AppProvider>
      <main className={styles.main}>
        <Header initialCompanyInfo={initialCompanyInfo} />
        <ArticleContent article={article} />
        <TrustStandards isNarrow={true} />
        <FloatingCart />
        <Footer
          initialCompanyInfo={initialCompanyInfo}
          initialFooterNav={initialFooterNav}
        />
      </main>
      <GlobalProductModal />
      <GlobalCartModal />
      <MenuPopup />
      <CartShareHandler />
      <UrlHandler />
    </AppProvider>
  );
}
