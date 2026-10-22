import React from "react";
import styles from "./skeleton.module.scss";
import { Skeleton } from "@/components/common/skeleton/skeleton";

export const HeroSkeleton = () => {
  return (
    <section className={styles.heroSection}>
      <div className={styles.container}>
        <div className={styles.textCard}>
          <div className={styles.titleWrapper}>
            <Skeleton className={styles.titleLine} width="80%" height="40px" />
            <Skeleton className={styles.titleLine} width="60%" height="40px" />
          </div>

          {/* Photo Row for Mobile */}
          <div className={styles.photoRow}>
            <Skeleton className={styles.photoWrapper} width="45%" height="200px" borderRadius="16px" />
            <div className={styles.description}>
              <Skeleton width="100%" height="14px" />
              <Skeleton width="90%" height="14px" />
              <Skeleton width="95%" height="14px" />
            </div>
          </div>

          <div className={styles.subtitleWrapper}>
            <Skeleton className={styles.subtitleLine} width="90%" height="20px" />
            <Skeleton className={styles.subtitleLine} width="85%" height="20px" />
            <Skeleton className={styles.subtitleLine} width="40%" height="20px" />
          </div>

          <div className={styles.actionArea}>
            <div className={styles.actionItem}>
              <Skeleton className={styles.actionButton} height="50px" borderRadius="100px" />
              <div className={styles.helperText}>
                <Skeleton width="120px" height="14px" />
                <Skeleton width="100px" height="14px" />
              </div>
            </div>
            <div className={styles.actionItem}>
              <Skeleton className={styles.actionButton} height="50px" borderRadius="100px" />
              <div className={styles.helperText}>
                <Skeleton width="120px" height="14px" />
                <Skeleton width="100px" height="14px" />
              </div>
            </div>
          </div>

          <div className={styles.features}>
            <Skeleton width="150px" height="24px" />
            <Skeleton width="150px" height="24px" />
            <Skeleton width="150px" height="24px" />
          </div>
        </div>

        <div className={styles.imageColumn}>
          <Skeleton className={styles.imageCard} height="100%" borderRadius="24px" />
          <Skeleton className={styles.imageCard} height="100%" borderRadius="24px" />
        </div>
      </div>
    </section>
  );
};
