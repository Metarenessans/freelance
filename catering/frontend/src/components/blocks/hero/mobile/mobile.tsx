"use client";

import { useState } from "react";
import styles from "./mobile.module.scss";
import { Feature } from "@/components/common/feature/feature";
import { DeliveryIcon, DiscountIcon } from "@/components/icons";
import { Button } from "@/components/common/button/button";
import { Image } from "@/components/common/image/image";
import { useCategoryNavigation } from "@/hooks/use-category-navigation";
import { useGetCompanyInfoQuery, type CompanyInfo } from "@/store/services/companyApi";
import { IS_DELIVERY_ENABLED } from "@/context/app-context";
import NextImage from "next/image";
import logo from "../../header/content/logo.png";

export interface MobileHeroProps {
  initialCompanyInfo?: CompanyInfo;
}

export const MobileHero = ({ initialCompanyInfo }: MobileHeroProps = {}) => {
  const { navigateToCategory } = useCategoryNavigation();
  const { data: apiCompanyInfo, isLoading: isQueryLoading } = useGetCompanyInfoQuery();
  const companyInfo = apiCompanyInfo || initialCompanyInfo;
  const isLoading = isQueryLoading && !initialCompanyInfo;
  const reviewsUrl = companyInfo?.reviewsUrl;
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleMenuClick = (e?: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (e) e.preventDefault();
    navigateToCategory(undefined, "catalog");
  };

  return (
    <section className={styles.heroSection}>
      <div className={styles.container}>
        {/* Title block */}
        <div className={styles.titleBlock}>
          <p aria-hidden="true" className={styles.title}>
            Affordable and <br />
            <span className={styles.titleAccent}>delicious catering -</span>
            from a food box to a banquet.
          </p>
        </div>

        {/* Photo + Description row */}
        <div className={styles.photoRow}>
          <div className={styles.photoWrapper}>
            <Image
              src={companyInfo?.heroImageTopMobile || companyInfo?.heroImageTop || ""}
              alt="Chef Meal Catering chef in Naberezhnye Chelny"
              wrapperClassName={styles.imageCard}
              onLoad={() => setIsImageLoaded(true)}
              isLoading={isLoading}
              priority={true}
            />
            {isImageLoaded && (
              <div className={styles.logoOverlay}>
                <NextImage src={logo} alt="Chef Meal Catering logo" width={54} height={30} className={styles.overlayLogoImg} />
              </div>
            )}
          </div>
          <p className={styles.description}>
            The Chef Meal team brings your ideas to life and takes care of every food detail.
          </p>
        </div>

        <div className={styles.actionArea}>
          <Button href="#catalog" type="link" onClick={handleMenuClick}>
            Value platters
          </Button>
          <Button target="_blank" type="link" href={reviewsUrl || "#"}>
            Read our reviews
          </Button>
        </div>

        {/* Features row */}
        <div className={styles.features}>
          <Feature
            icon={<DeliveryIcon />}
            text={IS_DELIVERY_ENABLED ? "Free delivery on orders over 10,000 ₽" : "Beautiful presentation and styling"}
          />
          <Feature
            icon={<DiscountIcon />}
            text="Platters from 1,490 ₽ per person"
          />
        </div>
      </div>
    </section>
  );
};
