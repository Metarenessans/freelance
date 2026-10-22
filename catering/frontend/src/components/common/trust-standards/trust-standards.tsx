import React from "react";
import classNames from "classnames";
import styles from "./trust-standards.module.scss";

interface TrustStandardsProps {
  className?: string;
  isNarrow?: boolean;
}

export const TrustStandards: React.FC<TrustStandardsProps> = ({
  className,
  isNarrow = false,
}) => {
  return (
    <section
      className={classNames(
        styles.section,
        { [styles.narrow]: isNarrow },
        className
      )}
      aria-label="Quality standards and food safety"
    >
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <div className={styles.content}>
          <div className={styles.headerRow}>
            <h3 className={styles.title}>Food safety and standards</h3>
          </div>
          <p className={styles.text}>
            All dishes and platters are prepared in accordance with sanitary requirements{" "}
            <a
              href="https://docs.cntd.ru/document/566276706"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              SanPiN 2.3/2.4.3590-20
            </a>{" "}
            and national quality standards for catering services{" "}
            <a
              href="https://docs.cntd.ru/document/1200107325"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              GOST 30390-2013
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
};
