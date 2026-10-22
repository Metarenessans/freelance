"use client";
import { DesktopHero } from "./desktop/desktop";
import { MobileHero } from "./mobile/mobile";
import styles from "./hero.module.scss";
import type { CompanyInfo } from "@/store/services/companyApi";

export interface HeroProps {
  initialCompanyInfo?: CompanyInfo;
}

export const Hero = ({ initialCompanyInfo }: HeroProps = {}) => {
  return (
    <>
      <div className={styles.desktopOnly}>
        <DesktopHero initialCompanyInfo={initialCompanyInfo} />
      </div>
      <div className={styles.mobileOnly}>
        <MobileHero initialCompanyInfo={initialCompanyInfo} />
      </div>
    </>
  );
};
