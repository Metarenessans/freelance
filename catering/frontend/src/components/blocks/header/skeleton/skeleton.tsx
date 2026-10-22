import React from "react";
import styles from "./skeleton.module.scss";
import { Skeleton } from "@/components/common/skeleton/skeleton";

export const HeaderSkeleton = () => {
  return (
    <header className={styles.headerSkeleton}>
      <Skeleton width="100%" height="100%" borderRadius="0" />
    </header>
  );
};
