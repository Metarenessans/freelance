import React from "react";
import styles from "./skeleton.module.scss";
import { Skeleton } from "@/components/common/skeleton/skeleton";

export const CatalogSkeleton = () => {
  return (
    <div className={styles.catalogSkeleton}>
      {/* Filters (Tags) Skeleton */}
      <div className={styles.filtersSkeleton}>
        {Array.from({ length: 24 }).map((_, index) => (
          <Skeleton
            key={index}
            className={styles.filterTag}
            width={[80, 100, 70, 120, 90][index % 5] + "px"}
            height="34px"
            borderRadius="100px"
          />
        ))}
      </div>

      {/* Products Skeleton */}
      <div className={styles.catalogWrapper}>
        <div className={styles.catalogGrid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className={styles.productCard}>
              <Skeleton width="100%" height="100%" borderRadius="12px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
