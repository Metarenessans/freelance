"use client";

import { useState } from "react";
import styles from "./desktop.module.scss";
import { Button } from "@/components/common/button/button";
import { Feature } from "@/components/common/feature/feature";
import { PersonIcon, DeliveryIcon, MenuCheckIcon } from "@/components/icons";
import { Image } from "@/components/common/image/image";
import { useCategoryNavigation } from "@/hooks/use-category-navigation";
import { useGetCompanyInfoQuery, type CompanyInfo } from "@/store/services/companyApi";
import { IS_DELIVERY_ENABLED } from "@/context/app-context";
import NextImage from "next/image";
import logo from "../../header/content/logo.png";

export interface DesktopHeroProps {
  initialCompanyInfo?: CompanyInfo;
}

export const DesktopHero = ({ initialCompanyInfo }: DesktopHeroProps = {}) => {
  const { navigateToCategory } = useCategoryNavigation();
  const { data: apiCompanyInfo, isLoading: isQueryLoading } = useGetCompanyInfoQuery();
  const companyInfo = apiCompanyInfo || initialCompanyInfo;
  const isLoading = isQueryLoading && !initialCompanyInfo;
  const reviewsUrl = companyInfo?.reviewsUrl;
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleMenuClick = (e?: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (e) e.preventDefault();
    navigateToCategory(undefined, "catalog");
  };

  return (
    <section className={styles.heroSection}>
      <div className={styles.container}>
        <div className={styles.textCard}>
          <h1 className={styles.title}>
            Affordable and <br />
            <span className={styles.highlight}>delicious catering</span> -
            <br />
            from a food box to a banquet
          </h1>

          <p className={styles.subtitle}>
            Hi, I am Mila. My team at Chef Meal Catering creates beautifully presented food and exciting flavor combinations for your celebrations.
          </p>

          <div className={styles.actionArea}>
            <div>
              <Button href="#catalog" type="link" onClick={handleMenuClick}>
                Value platters
              </Button>
              <div className={styles.helperText}>
                Popular platters <br />
                at great prices
              </div>
            </div>

            <div>
              <Button href={reviewsUrl || "#"} target="_blank" type="link">
                Read our reviews
              </Button>
              <div className={styles.helperText}>
                Find out what our<br />
                customers say
              </div>
            </div>
          </div>

          <div className={styles.features}>
            <Feature
              icon={<PersonIcon />}
              text="A satisfying menu from 1,490 ₽ per person"
            />
            <Feature
              icon={<DeliveryIcon />}
              text={IS_DELIVERY_ENABLED ? "Free delivery on orders over 10,000 ₽" : "Beautiful presentation and styling"}
            />
            <Feature
              icon={<MenuCheckIcon />}
              text="Free menu planning for your event"
            />
          </div>
        </div>

        {/* Image Column */}
        <div className={styles.imageColumn}>
          <div className={styles.topImageWrapper}>
            <Image
              src={companyInfo?.heroImageTop ?? ""}
              alt="Event catering and festive buffets in Naberezhnye Chelny by Chef Meal Catering"
              wrapperClassName={styles.imageCard}
              onLoad={() => setIsImageLoaded(true)}
              isLoading={isLoading}
            />
            {isImageLoaded && (
              <div className={styles.logoOverlay}>
                <NextImage src={logo} alt="Chef Meal Catering logo" width={130} height={72} className={styles.overlayLogoImg} />
              </div>
            )}
          </div>
          <Image
            src={companyInfo?.heroImageBottom ?? ""}
            alt="Festive table setting and buffet dishes by Chef Meal Catering"
            wrapperClassName={styles.imageCard}
          />
        </div>
      </div>
    </section>
  );
};
