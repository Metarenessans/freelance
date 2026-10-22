import React from "react";
import styles from "./skeleton.module.scss";
import { Skeleton } from "@/components/common/skeleton/skeleton";

export const FaqSkeleton = () => {
  return (
    <div className={styles.faqSkeleton}>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className={styles.faqItemSkeleton}>
          <Skeleton width="100%" height="64px" borderRadius="0" />
        </div>
      ))}
    </div>
  );
};
