"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./header.module.scss";
import logo from "./content/logo.png";
import { useState, useEffect } from "react";
import { TelegramIcon, PhoneIcon } from "@/components/icons";
import { formatPhoneNumber } from "@/utils/formatPhoneNumber";
import { Cart } from "@/components/common/cart/cart";
import { Skeleton } from "@/components/common/skeleton/skeleton";

const NAV_DATA = [
  { label: "Menu", href: "/#catalog" },
  { label: "FAQ", href: "/#faq" },
  { label: "Blog", href: "/blog" },
  {
    label: "Read our reviews",
    href: "/#faq",
    isExternal: true,
  },
];

import { useCategoryNavigation } from "@/hooks/use-category-navigation";
import { useGetCompanyInfoQuery, type CompanyInfo } from "@/store/services/companyApi";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

interface HeaderVariantProps {
  initialCompanyInfo?: CompanyInfo;
  hideOnScroll?: boolean;
}

const DesktopHeader = ({ initialCompanyInfo, hideOnScroll }: HeaderVariantProps) => {
  const { navigateToCategory } = useCategoryNavigation();
  const { data: apiCompanyInfo, isLoading: isQueryLoading } = useGetCompanyInfoQuery(
    undefined,
    { skip: Boolean(initialCompanyInfo) }
  );
  const companyInfo = apiCompanyInfo || initialCompanyInfo;
  const isLoading = isQueryLoading && !initialCompanyInfo;
  const isHeaderVisible = useScrollDirection(hideOnScroll);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#") || href.startsWith("/#")) {
      const id = href.replace("/#", "").replace("#", "");

      if (typeof window !== "undefined" && window.location.pathname === "/") {
        e.preventDefault();
        navigateToCategory(undefined, id);
      }
    }
  };

  const reviewsUrl = companyInfo?.reviewsUrl || "";
  const phoneNumber = companyInfo?.phoneNumber || "";
  const telegram = companyInfo?.telegram || "";
  const max = companyInfo?.max || "";

  const companyName = companyInfo?.companyName || "Chef Meal Catering";
  const logoAlt = `${companyName} - catering and buffet delivery in Naberezhnye Chelny`;

  const navItems = NAV_DATA.map((item) =>
    item.label === "Read our reviews"
      ? { ...item, href: reviewsUrl || item.href }
      : item
  );

  return (
    <header className={`${styles.header} ${!isHeaderVisible ? styles.headerHidden : ""}`}>
      <div className={styles.logo}>
        <Link
          href="/"
          onClick={() => {
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("main_page_scroll_pos");
              sessionStorage.removeItem("from_main_page");
              if (window.location.pathname === "/") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }
          }}
        >
          <Image
            src={logo}
            alt={logoAlt}
            width={45}
            height={40}
            priority
            className={styles.logoImage}
          />
        </Link>
      </div>

      <nav className={styles.nav}>
        {isLoading ? (
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Skeleton width="60px" height="18px" borderRadius="4px" />
            <Skeleton width="70px" height="18px" borderRadius="4px" />
            <Skeleton width="160px" height="18px" borderRadius="4px" />
          </div>
        ) : (
          navItems.map(({ label, href, isExternal }) => (
            <Link
              key={href}
              href={href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              onClick={(e) => handleNavClick(e, href)}
            >
              {label}
            </Link>
          ))
        )}
      </nav>

      <div className={styles.actions}>
        {isLoading ? (
          <Skeleton width="130px" height="20px" borderRadius="4px" />
        ) : (
          <a href={`tel:${phoneNumber}`} className={styles.phone}>
            {formatPhoneNumber(phoneNumber)}
          </a>
        )}

        <div className={styles.socials}>
          {isLoading ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Skeleton width="24px" height="24px" borderRadius="50%" />
              <Skeleton width="24px" height="24px" borderRadius="50%" />
            </div>
          ) : (
            <>
              <a href={telegram} aria-label="Telegram" target="_blank" rel="noopener noreferrer">
                <TelegramIcon />
              </a>
              <a href={max} aria-label="Message us on Max" target="_blank" rel="noopener noreferrer">
                <img src="/logo-max.svg" alt="Message us on Max" width={24} height={24} />
              </a>
            </>
          )}
        </div>

        <Cart />

        <Link href="/calculate" className={styles.ctaButton}>
          Get a menu estimate
        </Link>
      </div>
    </header>
  );
};

const MobileHeader = ({ initialCompanyInfo, hideOnScroll }: HeaderVariantProps) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { navigateToCategory } = useCategoryNavigation();
  const { data: apiCompanyInfo, isLoading: isQueryLoading } = useGetCompanyInfoQuery(
    undefined,
    { skip: Boolean(initialCompanyInfo) }
  );
  const companyInfo = apiCompanyInfo || initialCompanyInfo;
  const isLoading = isQueryLoading && !initialCompanyInfo;
  const isHeaderVisible = useScrollDirection(hideOnScroll);

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#") || href.startsWith("/#")) {
      const id = href.replace("/#", "").replace("#", "");
      if (typeof window !== "undefined" && window.location.pathname === "/") {
        e.preventDefault();
        navigateToCategory(undefined, id);
        setIsMobileOpen(false);
      }
    }
  };

  const reviewsUrl = companyInfo?.reviewsUrl || "";
  const phoneNumber = companyInfo?.phoneNumber || "";
  const telegram = companyInfo?.telegram || "";
  const max = companyInfo?.max || "";

  const companyName = companyInfo?.companyName || "Chef Meal Catering";
  const logoAlt = `${companyName} - catering and buffet delivery in Naberezhnye Chelny`;

  const navItems = NAV_DATA.map((item) =>
    item.label === "Read our reviews"
      ? { ...item, href: reviewsUrl || item.href }
      : item
  );

  return (
    <header
      className={`${styles.headerMobile} ${isMobileOpen ? styles.menuOpen : ""} ${!isHeaderVisible && !isMobileOpen ? styles.headerHidden : ""
        }`}
    >
      <div className={styles.logo}>
        <Link
          href="/"
          onClick={() => {
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("main_page_scroll_pos");
              sessionStorage.removeItem("from_main_page");
              if (window.location.pathname === "/") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }
          }}
        >
          <Image
            src={logo}
            alt={logoAlt}
            width={38}
            height={34}
            priority
            className={styles.logoImage}
          />
        </Link>
      </div>

      {!isMobileOpen && (
        <Link
          href="/calculate"
          className={styles.mobileCtaButton}
        >
          Get a menu estimate
        </Link>
      )}

      <div className={styles.actionsMobile}>
        {phoneNumber ? (
          <a
            href={`tel:${phoneNumber}`}
            className={styles.phoneIconLink}
            aria-label={`Call ${phoneNumber}`}
          >
            <PhoneIcon size={22} color="currentColor" />
          </a>
        ) : null}
        <button
          className={`${styles.hamburger} ${isMobileOpen ? styles.open : ""}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div className={`${styles.mobileMenu} ${isMobileOpen ? styles.open : ""}`}>
        <nav className={styles.mobileNav}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
              <Skeleton width="80px" height="20px" borderRadius="4px" />
              <Skeleton width="90px" height="20px" borderRadius="4px" />
              <Skeleton width="180px" height="20px" borderRadius="4px" />
            </div>
          ) : (
            navItems.map(({ label, href, isExternal }) => (
              <Link
                key={href}
                href={href}
                onClick={(e) => {
                  handleNavClick(e, href);
                  if (!href.startsWith("#") && !href.startsWith("/#")) {
                    toggleMobileMenu();
                  }
                }}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
              >
                {label}
              </Link>
            ))
          )}
        </nav>

        <div className={styles.mobileActions}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <Skeleton width="140px" height="24px" borderRadius="4px" />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Skeleton width="24px" height="24px" borderRadius="50%" />
                <Skeleton width="24px" height="24px" borderRadius="50%" />
              </div>
            </div>
          ) : (
            <>
              <a href={`tel:${phoneNumber}`} className={styles.phone}>
                {formatPhoneNumber(phoneNumber)}
              </a>
              <div className={styles.socials}>
                <a href={telegram} aria-label="Telegram" target="_blank" rel="noopener noreferrer">
                  <TelegramIcon />
                </a>
                <a href={max} aria-label="Message us on Max" target="_blank" rel="noopener noreferrer">
                  <img src="/logo-max.svg" alt="Message us on Max" width={24} height={24} />
                </a>
              </div>
            </>
          )}
          <Link
            href="/calculate"
            className={styles.ctaButton}
            onClick={() => {
              setIsMobileOpen(false);
            }}
          >
            Get a menu estimate
          </Link>
        </div>
      </div>
    </header>
  );
};

export interface HeaderProps {
  initialCompanyInfo?: CompanyInfo;
  hideOnScroll?: boolean;
}

export const Header = ({ initialCompanyInfo, hideOnScroll }: HeaderProps = {}) => {
  return (
    <>
      <DesktopHeader initialCompanyInfo={initialCompanyInfo} hideOnScroll={hideOnScroll} />
      <MobileHeader initialCompanyInfo={initialCompanyInfo} hideOnScroll={hideOnScroll} />
    </>
  );
};
