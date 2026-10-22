import React from "react";
import styles from "./feature.module.scss";

export interface FeatureProps {
  icon: React.ReactNode;
  text: string;
  children?: React.ReactNode;
}

export const Feature = ({ icon, text, children }: FeatureProps) => {
  return (
    <div className={styles.featureItem}>
      <div className={styles.iconWrapper}>{icon}</div>
      <div className={styles.featureText}>{children || text}</div>
    </div>
  );
};
