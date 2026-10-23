"use client";

import { HomeDemoNotice } from "@/components/common/home-demo-notice";

import Link from "next/link";
import { Sections } from "@/components/blocks/sections/sections";
import { Header } from "@/components/blocks/header";
import { Hero } from "@/components/blocks/hero";
import { AppProvider } from "@/context/app-context";
import style from "./style.module.scss";
import { FloatingCart } from "@/components/common/cart/floating-cart";
import { Image } from "@/components/common/image/image";
import { toPublicMediaUrl } from "@/utils/seo";

import { GlobalProductModal } from "@/components/common/product-modal/global-product-modal";
import { GlobalCartModal } from "@/components/common/cart/global-cart-modal";

import { MenuPopup } from "@/components/common/menu-popup/menu-popup";
import { CartShareHandler } from "@/components/common/cart/cart-share-handler";
import { UrlHandler } from "@/components/common/url-handler/url-handler";
import { MainScrollRestoration } from "@/components/common/scroll-restoration/main-scroll-restoration";

import { Faq } from "@/components/blocks/faq/faq";
import { Footer } from "@/components/blocks/footer/footer";
import { ProtectedZone } from "@/components/common/error-boundary/ProtectedZone";
import type { Section } from "@/store/services/catalogApi";
import type { CompanyInfo, FooterNavItem } from "@/store/services/companyApi";
import type { FaqItem } from "@/store/services/faqApi";
import type { SimpleBlogArticle } from "@/store/services/blogApi";

interface SectionsPageProps {
  initialSections?: Section[];
  initialCompanyInfo?: CompanyInfo;
  initialFaq?: FaqItem[];
  initialFooterNav?: FooterNavItem[];
  featuredArticle?: SimpleBlogArticle;
}

export default function SectionsPage({
  initialSections,
  initialCompanyInfo,
  initialFaq,
  initialFooterNav,
  featuredArticle,
}: SectionsPageProps = {}) {
  return (
    <AppProvider>
      <MainScrollRestoration />
      <main className={style.main}>
        <Header initialCompanyInfo={initialCompanyInfo} />

        {/* Hidden semantic breadcrumb navigation for the home page. */}
        <nav aria-label="Breadcrumbs" className={style.breadcrumbsHidden}>
          <ol itemScope itemType="https://schema.org/BreadcrumbList">
            <li
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              <meta itemProp="position" content="1" />
              <span itemProp="name">Home</span>
              <link itemProp="item" href={process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"} />
            </li>
          </ol>
        </nav>

        <div className={style.container}>
          <ProtectedZone>
            <div className={style.heroWithNotice}>
              <HomeDemoNotice />
              <Hero initialCompanyInfo={initialCompanyInfo} />
            </div>
            <Sections initialSections={initialSections} />

            {/* Chef advice in a semantic article element. */}
            {featuredArticle && (
              <article
                className={style.featuredArticle}
                aria-labelledby="featured-article-heading"
              >
                <div className={style.articleInner}>
                  <div className={style.articleContent}>
                    <div className={style.articleMeta}>
                      <span className={style.badge}>Chef tip</span>
                      {featuredArticle.created_date && (
                        <time
                          className={style.date}
                          dateTime={featuredArticle.created_date}
                        >
                          {featuredArticle.created_date
                            .split("-")
                            .reverse()
                            .join(".")}
                        </time>
                      )}
                    </div>
                    <h2
                      id="featured-article-heading"
                      className={style.articleTitle}
                    >
                      <Link href={`/blog/${featuredArticle.slug}`}>
                        {featuredArticle.title}
                      </Link>
                    </h2>
                    {featuredArticle.seo_description && (
                      <p className={style.articleDescription}>
                        {featuredArticle.seo_description}
                      </p>
                    )}
                    <div className={style.articleActions}>
                      <Link
                        href={`/blog/${featuredArticle.slug}`}
                        className={style.readBtn}
                      >
                        <span>Read the guide</span>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </Link>
                      <Link href="/blog" className={style.allBlogLink}>
                        All blog articles →
                      </Link>
                    </div>
                  </div>
                  {featuredArticle.cover && (
                    <div className={style.articlePoster}>
                      <Link href={`/blog/${featuredArticle.slug}`}>
                        <Image
                          src={toPublicMediaUrl(featuredArticle.cover)}
                          alt={
                            featuredArticle.cover_alt || featuredArticle.title
                          }
                          wrapperClassName={style.posterImageWrapper}
                          className={style.posterImage}
                        />
                      </Link>
                    </div>
                  )}
                </div>
              </article>
            )}

            <Faq initialFaq={initialFaq} />


          </ProtectedZone>
        </div>

        <FloatingCart />
        <Footer
          initialCompanyInfo={initialCompanyInfo}
          initialFooterNav={initialFooterNav}
          initialSections={initialSections}
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
