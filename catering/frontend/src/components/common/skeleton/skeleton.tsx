import React from "react";
import classNames from "classnames";
import styles from "./skeleton.module.scss";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export const Skeleton = ({ className, width, height, borderRadius }: SkeletonProps) => {
  return (
    <div
      className={classNames(styles.skeleton, className)}
      style={{
        width: width,
        height: height,
        borderRadius: borderRadius,
      }}
    />
  );
};
