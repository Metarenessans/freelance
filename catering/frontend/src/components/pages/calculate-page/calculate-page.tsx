"use client";

import { TrustStandards } from "@/components/common/trust-standards";

import React from "react";
import styles from "./calculate-page.module.scss";
import { Header } from "@/components/blocks/header";
import { AppProvider } from "@/context/app-context";
import { FloatingCart } from "@/components/common/cart/floating-cart";
import { GlobalProductModal } from "@/components/common/product-modal/global-product-modal";
import { GlobalCartModal } from "@/components/common/cart/global-cart-modal";
import { CartShareHandler } from "@/components/common/cart/cart-share-handler";
import { Footer } from "@/components/blocks/footer/footer";
import { JsonLd } from "@/components/common/json-ld";
import { Breadcrumbs } from "@/components/common/breadcrumbs/breadcrumbs";
import { MenuPopup } from "@/components/common/menu-popup/menu-popup";
import { Faq } from "@/components/blocks/faq/faq";
import type { CalculatePageConfig } from "@/components/common/json-ld";
import type { CompanyInfo, FooterNavItem } from "@/store/services/companyApi";
import type { Section } from "@/store/services/catalogApi";

interface CalculatePageProps {
  config?: CalculatePageConfig;
  jsonLdData?: any;
  initialCompanyInfo?: CompanyInfo;
  initialFooterNav?: FooterNavItem[];
  initialSections?: Section[];
}

export const CalculatePage = ({
  config,
  jsonLdData,
  initialCompanyInfo,
  initialFooterNav,
  initialSections,
}: CalculatePageProps) => {
  const heroBadge = config?.hero_badge;
  const heroTitle = config?.hero_title;
  const heroDescription = config?.hero_description;
  const features = config?.features || [];
  const stepsTitle = config?.steps_title;
  const stepsSubtitle = config?.steps_subtitle;
  const steps = config?.steps || [];
  const faqTitle = config?.faq_title;
  const faqSubtitle = config?.faq_subtitle;
  const faqs = config?.faqs || [];

  return (
    <AppProvider>
      {jsonLdData && <JsonLd data={jsonLdData} />}
      <main className={styles.main}>
        <Header initialCompanyInfo={initialCompanyInfo} />

        <div className={styles.container}>
          <Breadcrumbs
            items={[
              { name: "Home", url: "/" },
              { name: "Get a menu estimate" },
            ]}
          />

          <section className={styles.hero}>
            {heroBadge && <span className={styles.heroBadge}>{heroBadge}</span>}
            {heroTitle && <h1 className={styles.title}>{heroTitle}</h1>}
            {heroDescription && <p className={styles.description}>{heroDescription}</p>}

            {features.length > 0 && (
              <div className={styles.featuresRow}>
                {features.map((f, idx) => (
                  <div key={f.id ?? idx} className={styles.featureCard}>
                    <span className={styles.featureIcon}>{f.icon}</span>
                    <div>
                      <div className={styles.featureTitle}>{f.title}</div>
                      <div className={styles.featureSub}>{f.subtitle}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={styles.formWrapper} id="calculate-form">
            <MenuPopup
              isEmbedded={true}
              budgetOptions={config?.budget_options?.map((b: any) =>
                typeof b === "string" ? b : b.name
              )}
              foodOptions={config?.food_options?.map((f: any) =>
                typeof f === "string" ? f : f.name
              )}
            />
          </section>

          {steps.length > 0 && (
            <section className={styles.infoSection}>
              <div className={styles.sectionHeading}>
                {stepsTitle && <h2>{stepsTitle}</h2>}
                {stepsSubtitle && <p>{stepsSubtitle}</p>}
              </div>

              <div className={styles.stepsGrid}>
                {steps.map((s, idx) => (
                  <div key={s.id ?? idx} className={styles.stepCard}>
                    <div className={styles.stepNumber}>{s.step}</div>
                    <div className={styles.stepTitle}>{s.title}</div>
                    <p className={styles.stepText}>{s.text}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {faqs.length > 0 && (
            <Faq
              items={faqs}
              title={faqTitle || "Questions and answers"}
              subtitle={faqSubtitle}
              isNarrow={true}
            />
          )}
          <TrustStandards isNarrow={true} />
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
      <MenuPopup />
    </AppProvider>
  );
};
