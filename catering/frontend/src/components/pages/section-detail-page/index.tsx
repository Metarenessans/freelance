"use client";

import { useEffect } from "react";

import { Header } from "@/components/blocks/header";
import { AppProvider } from "@/context/app-context";
import style from "./style.module.scss";
import { FloatingCart } from "@/components/common/cart/floating-cart";
import { GlobalProductModal } from "@/components/common/product-modal/global-product-modal";
import { GlobalCartModal } from "@/components/common/cart/global-cart-modal";
import { MenuPopup } from "@/components/common/menu-popup/menu-popup";
import { CartShareHandler } from "@/components/common/cart/cart-share-handler";
import { UrlHandler } from "@/components/common/url-handler/url-handler";
import { Footer } from "@/components/blocks/footer/footer";
import { ProtectedZone } from "@/components/common/error-boundary/ProtectedZone";
import { SectionCatalog } from "@/components/blocks/section-catalog/section-catalog";
import { Sections } from "@/components/blocks/sections/sections";
import type { Section, Category, Product as ProductType } from "@/store/services/catalogApi";
import type { CompanyInfo, FooterNavItem } from "@/store/services/companyApi";

interface SectionDetailPageProps {
  slug: string;
  initialSections?: Section[];
  initialCategories?: Category[];
  initialProducts?: ProductType[];
  initialCompanyInfo?: CompanyInfo;
  initialFooterNav?: FooterNavItem[];
}

export default function SectionDetailPage({
  slug,
  initialSections,
  initialCategories,
  initialProducts,
  initialCompanyInfo,
  initialFooterNav,
}: SectionDetailPageProps) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [slug]);

  return (
    <AppProvider>
      <main className={style.main}>
        <Header initialCompanyInfo={initialCompanyInfo} />

        <div className={style.container}>
          <ProtectedZone>
            <SectionCatalog
              sectionSlug={slug}
              initialSections={initialSections}
              initialCategories={initialCategories}
              initialProducts={initialProducts}
            />
            <Sections
              excludeSlug={slug}
              title="Buffet menu"
              subtitle="Ready-made party food boxes, bruschetta, canapes and appetizer platters for delivery"
              id="other-sections"
              initialSections={initialSections}
            />
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
