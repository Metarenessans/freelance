"use client";
import React from 'react';
import Link from 'next/link';
import styles from './footer.module.scss';
import { useGetCompanyInfoQuery, type CompanyInfo, type FooterNavItem } from '@/store/services/companyApi';
import { useGetSectionsQuery, type Section } from '@/store/services/catalogApi';
import { formatPhoneNumber } from '@/utils/formatPhoneNumber';

export interface FooterProps {
  initialCompanyInfo?: CompanyInfo;
  initialFooterNav?: FooterNavItem[];
  initialSections?: Section[];
}

export const Footer = ({ initialCompanyInfo, initialSections }: FooterProps = {}) => {
  const { data: apiCompanyInfo } = useGetCompanyInfoQuery(
    undefined,
    { skip: Boolean(initialCompanyInfo) }
  );
  const { data: apiSections } = useGetSectionsQuery(
    undefined,
    { skip: Boolean(initialSections?.length) }
  );

  const effectiveCompanyInfo = apiCompanyInfo || initialCompanyInfo;
  const effectiveSections = apiSections || initialSections;

  const {
    phoneNumber,
    inn,
    ogrn,
    address,
    email,
    telegram,
    max,
    companyName,
    rknRegistryUrl,
    rknRegistryNumber,
  } = effectiveCompanyInfo || {};

  const effectiveRknNumber = rknRegistryNumber
    ? (rknRegistryNumber.startsWith("№") ? rknRegistryNumber : `№ ${rknRegistryNumber}`)
    : "№ 16-25-059794";

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.column}>
          <div className={styles.legalInfo}>
            <p className={styles.text}>© {new Date().getFullYear()}. All rights reserved {companyName}</p>
            <p className={styles.text}>
              {inn && `Tax ID: ${inn} `} {ogrn && `Registration number: ${ogrn}`}
            </p>
            <Link href="/privacy-policy" className={styles.textLink}>Privacy policy</Link>
            <Link href="/user-agreement" className={styles.textLink}>Terms of use</Link>
            <Link href="/public-offer" className={styles.textLink}>Public offer</Link>
            <Link href="/blog" className={styles.textLink}>Blog and articles</Link>
          </div>

          <div className={styles.socials}>
            <a href={telegram} target="_blank" rel="noreferrer" className={styles.socialIconLarge} aria-label="Telegram">
              <svg height="28" viewBox="0 0 48 48" fill="none">
                <path d="M41.4193 7.30899C41.4193 7.30899 45.3046 5.79399 44.9808 9.47328C44.8729 10.9883 43.9016 16.2908 43.1461 22.0262L40.5559 39.0159C40.5559 39.0159 40.3401 41.5048 38.3974 41.9377C36.4547 42.3705 33.5408 40.4227 33.0011 39.9898C32.5694 39.6652 24.9068 34.7955 22.2086 32.4148C21.4531 31.7655 20.5897 30.4669 22.3165 28.9519L33.6487 18.1305C34.9438 16.8319 36.2389 13.8019 30.8426 17.4812L15.7331 27.7616C15.7331 27.7616 14.0063 28.8437 10.7686 27.8698L3.75342 25.7055C3.75342 25.7055 1.16321 24.0823 5.58815 22.459C16.3807 17.3729 29.6555 12.1786 41.4193 7.30899Z" fill="#fff"></path>
              </svg>
            </a>
            <span className={styles.socialSeparator}></span>
            <a href={max} target="_blank" rel="noreferrer" className={styles.socialIconLarge} aria-label="Max">
              <svg height="28" viewBox="0 0 131 42" fill="none">
                <path fill="#fff" fillRule="evenodd" d="M21.47 41.88c-4.11 0-6.02-.6-9.34-3-2.1 2.7-8.75 4.81-9.04 1.2 0-2.71-.6-5-1.28-7.5C1 29.5.08 26.07.08 21.1.08 9.23 9.82.3 21.36.3c11.55 0 20.6 9.37 20.6 20.91a20.6 20.6 0 0 1-20.49 20.67Zm.17-31.32c-5.62-.29-10 3.6-10.97 9.7-.8 5.05.62 11.2 1.83 11.52.58.14 2.04-1.04 2.95-1.95a10.4 10.4 0 0 0 5.08 1.81 10.7 10.7 0 0 0 11.19-9.97 10.7 10.7 0 0 0-10.08-11.1Z" clipRule="evenodd"></path>
                <path fill="#fff" d="M60.3 32.15h-4.44v-21h7.23l4.84 14.41h.65l5.05-14.41h7.07v21h-4.45v-15.6h-.64l-5.5 15.6H66.2l-5.25-15.6h-.65v15.6ZM94.59 32.55c-1.97 0-3.73-.46-5.3-1.37a9.99 9.99 0 0 1-3.67-3.88 12.15 12.15 0 0 1-1.29-5.65c0-2.1.43-3.98 1.3-5.62a9.63 9.63 0 0 1 3.67-3.88 10.04 10.04 0 0 1 5.29-1.4c1.75 0 3.3.37 4.64 1.12 1.35.73 2.45 1.62 3.31 2.67l.97-3.4H107v21h-3.47l-.97-3.39a11.45 11.45 0 0 1-3.32 2.7 9.62 9.62 0 0 1-4.64 1.1Zm1.13-4.16c1.97 0 3.55-.62 4.77-1.86a6.7 6.7 0 0 0 1.85-4.88c0-2-.62-3.61-1.85-4.85a6.3 6.3 0 0 0-4.77-1.9c-1.94 0-3.51.63-4.72 1.9a6.63 6.63 0 0 0-1.82 4.85c0 1.99.6 3.62 1.82 4.88a6.32 6.32 0 0 0 4.72 1.86ZM115.03 32.15h-5.25l6.66-10.75-5.9-10.25h5.26l3.91 7.06h.77l4.12-7.06h5.13l-5.9 9.97 6.67 11.03h-5.42l-4.48-7.96h-.77l-4.8 7.96Z"></path>
              </svg>
            </a>
          </div>

          {rknRegistryUrl && (
            <p className={styles.rknText}>
              Personal data controller.{" "}
              <br className={styles.mobileBreak} />
              <a
                href={rknRegistryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.rknLink}
              >
                {effectiveRknNumber}
              </a>{" "}
              in the Roskomnadzor register
            </p>
          )}
        </div>

        <div className={styles.column}>
          <h3 className={styles.title}>BUFFET MENU</h3>
          <nav className={styles.nav}>
            {effectiveSections?.map((section) => (
              <Link
                key={section.id}
                href={`/catalog/${section.id}`}
                prefetch={true}
                className={styles.link}
              >
                {section.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className={styles.column}>
          <h3 className={styles.title}>CONTACT</h3>
          <div className={styles.contactsList}>
            <a href={`tel:${phoneNumber}`} className={styles.contactLink}>
              {formatPhoneNumber(phoneNumber ?? '')}
            </a>
            <a href={`mailto:${email}`} className={styles.contactLink}>{email}</a>
            <p className={styles.text}>{address ?? 'Naberezhnye Chelny'}</p>
          </div>
        </div>
      </div>


    </footer>
  );
};
