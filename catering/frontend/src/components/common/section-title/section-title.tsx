import React from "react";
import styles from "./section-title.module.scss";

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}

export const SectionTitle = ({
  children,
  className = "",
  as: Component = "h2",
}: SectionTitleProps) => {
  return <Component className={`${styles.title} ${className}`}>{children}</Component>;
};
