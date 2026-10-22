import { Catalog } from "@/components/blocks/catalog/catalog";
import { Header } from "@/components/blocks/header";
import { Hero } from "@/components/blocks/hero";
import { AppProvider } from "@/context/app-context";
import style from "./style.module.scss";
import { FloatingCart } from "@/components/common/cart/floating-cart";

import { GlobalProductModal } from "@/components/common/product-modal/global-product-modal";
import { GlobalCartModal } from "@/components/common/cart/global-cart-modal";

import { MenuPopup } from "@/components/common/menu-popup/menu-popup";
import { CartShareHandler } from "@/components/common/cart/cart-share-handler";
import { UrlHandler } from "@/components/common/url-handler/url-handler";

import { Faq } from "@/components/blocks/faq/faq";
import { Footer } from "@/components/blocks/footer/footer";
import { ProtectedZone } from "@/components/common/error-boundary/ProtectedZone";

import type { CompanyInfo, FooterNavItem } from "@/store/services/companyApi";
import type { FaqItem } from "@/store/services/faqApi";
import type { Section } from "@/store/services/catalogApi";

interface HomePageProps {
  initialCompanyInfo?: CompanyInfo;
  initialFaq?: FaqItem[];
  initialFooterNav?: FooterNavItem[];
  initialSections?: Section[];
}

export default function HomePage({
  initialCompanyInfo,
  initialFaq,
  initialFooterNav,
  initialSections,
}: HomePageProps = {}) {
  return (
    <AppProvider>
      <main className={style.main}>
        <Header initialCompanyInfo={initialCompanyInfo} />

        <div className={style.container}>
          <ProtectedZone>
            <Hero initialCompanyInfo={initialCompanyInfo} />
            <Catalog />
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

