"use client";

import { TrustStandards } from "@/components/common/trust-standards";

import React from "react";
import { AppProvider } from "@/context/app-context";
import { Header } from "@/components/blocks/header";
import { Footer } from "@/components/blocks/footer/footer";
import { FloatingCart } from "@/components/common/cart/floating-cart";
import { GlobalProductModal } from "@/components/common/product-modal/global-product-modal";
import { GlobalCartModal } from "@/components/common/cart/global-cart-modal";
import { MenuPopup } from "@/components/common/menu-popup/menu-popup";
import { CartShareHandler } from "@/components/common/cart/cart-share-handler";
import { UrlHandler } from "@/components/common/url-handler/url-handler";
import { BlogCatalog } from "@/components/blocks/blog-catalog";
import type { SimpleBlogArticle } from "@/store/services/blogApi";
import type { CompanyInfo, FooterNavItem } from "@/store/services/companyApi";

interface BlogPageProps {
  articles: readonly SimpleBlogArticle[];
  initialCompanyInfo?: CompanyInfo;
  initialFooterNav?: FooterNavItem[];
}

export function BlogPage({
  articles,
  initialCompanyInfo,
  initialFooterNav,
}: BlogPageProps) {
  return (
    <AppProvider>
      <main style={{ backgroundColor: "var(--background)", minHeight: "100vh" }}>
        <Header initialCompanyInfo={initialCompanyInfo} />
        <BlogCatalog articles={articles} />
        <TrustStandards />
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
