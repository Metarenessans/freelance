"use client";
import React, { useState } from "react";
import styles from "./faq.module.scss";
import { SectionTitle } from "@/components/common/section-title/section-title";
import { useGetFaqQuery } from "@/store/services/faqApi";
import { FaqSkeleton } from "./skeleton/skeleton";

export interface FaqItem {
  question: string;
  answerItems: string[];
}

export interface FaqProps {
  initialFaq?: FaqItem[];
  items?: Array<{
    id?: number | string;
    question: string;
    answer?: string;
    answerItems?: string[];
  }>;
  title?: string;
  subtitle?: string;
  isNarrow?: boolean;
  className?: string;
}

const PlusCircleIcon = ({ className }: { className?: string }) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="16"></line>
    <line x1="8" y1="12" x2="16" y2="12"></line>
  </svg>
);

export const Faq = ({
  initialFaq,
  items,
  title = "Questions and answers",
  subtitle,
  isNarrow = false,
  className = "",
}: FaqProps = {}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const { data: apiFaq, isLoading: isQueryLoading } = useGetFaqQuery(undefined, {
    skip: !!items,
  });

  const rawList = items || apiFaq || initialFaq || [];
  const isLoading = !items && isQueryLoading && (!initialFaq || initialFaq.length === 0);

  const faqList = rawList.map((item) => {
    let answerLines: string[] = [];
    if ("answerItems" in item && Array.isArray(item.answerItems) && item.answerItems.length > 0) {
      answerLines = item.answerItems;
    } else if ("answer" in item && item.answer) {
      answerLines = item.answer.split("\n").filter(Boolean);
    }
    return {
      question: item.question,
      answerItems: answerLines,
    };
  });

  return (
    <section id="faq" className={`${styles.section} ${className}`}>
      {title && <SectionTitle>{title}</SectionTitle>}
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      <div className={`${styles.faqSection} ${isNarrow ? styles.narrow : ""}`}>
        {isLoading ? (
          <FaqSkeleton />
        ) : (
          <div className={styles.faqList}>
            {faqList.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={index} className={styles.faqItem}>
                  <button
                    className={styles.questionBtn}
                    onClick={() => toggle(index)}
                    type="button"
                    aria-expanded={isOpen}
                  >
                    <span className={styles.questionText}>{item.question}</span>
                    <span className={`${styles.icon} ${isOpen ? styles.iconOpen : ""}`}>
                      <PlusCircleIcon />
                    </span>
                  </button>
                  <div className={`${styles.answerWrapper} ${isOpen ? styles.open : ""}`}>
                    <div className={styles.answerInner}>
                      <div className={styles.answerText}>
                        {item.answerItems.map((text, i) => (
                          <React.Fragment key={i}>
                            {text}
                            {i < item.answerItems.length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
