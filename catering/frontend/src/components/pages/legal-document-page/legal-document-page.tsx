"use client";

import React from "react";
import { Header } from "@/components/blocks/header";
import { AppProvider } from "@/context/app-context";
import { FloatingCart } from "@/components/common/cart/floating-cart";
import { GlobalProductModal } from "@/components/common/product-modal/global-product-modal";
import { GlobalCartModal } from "@/components/common/cart/global-cart-modal";
import { CartShareHandler } from "@/components/common/cart/cart-share-handler";
import { Footer } from "@/components/blocks/footer/footer";
import { JsonLd } from "@/components/common/json-ld";
import { Breadcrumbs } from "@/components/common/breadcrumbs/breadcrumbs";
import style from "./style.module.scss";
import type { CompanyInfo, FooterNavItem } from "@/store/services/companyApi";
import type { Section } from "@/store/services/catalogApi";

interface LegalDocumentPageProps {
  title: string;
  contentHtml?: string;
  fallbackContent?: React.ReactNode;
  jsonLdData?: any;
  initialCompanyInfo?: CompanyInfo;
  initialFooterNav?: FooterNavItem[];
  initialSections?: Section[];
}

export const LegalDocumentPage = ({
  title,
  contentHtml,
  fallbackContent,
  jsonLdData,
  initialCompanyInfo,
  initialFooterNav,
  initialSections,
}: LegalDocumentPageProps) => {
  return (
    <AppProvider>
      {jsonLdData && <JsonLd data={jsonLdData} />}
      <main className={style.main}>
        <Header initialCompanyInfo={initialCompanyInfo} />

        <div className={style.container}>
          <div>
            <Breadcrumbs
              items={[
                { name: "Home", url: "/" },
                { name: title },
              ]}
            />
            <h1 className={style.title}>{title}</h1>

            {contentHtml ? (
              <div
                className={style.content}
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            ) : (
              fallbackContent
            )}
          </div>
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
      <CartShareHandler />
    </AppProvider>
  );
};
