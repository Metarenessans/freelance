import React from "react";
import Link from "next/link";
import styles from "./button.module.scss";
import classNames from "classnames";
import { PlusIcon, MinusIcon, ArrowRightIcon } from "@/components/icons";

export interface ButtonProps {
  type?: "link" | "button" | "plus" | "minus" | "arrow";
  href?: string;
  target?: string;
  text?: string;
  width?: string;
  props?: any;
  onClick?: (
    e?: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
  ) => void;
  children?: React.ReactNode;
}

export const Button = ({
  type = "button",
  href,
  text,
  width,
  children,
  onClick,
  ...props
}: ButtonProps) => {
  switch (type) {
    case "link":
      return (
        <Link
          onClick={onClick}
          href={href || "#"}
          className={styles.button}
          style={{ width }}
          {...props}
        >
          {children || text}
        </Link>
      );
    case "button":
      return (
        <button
          onClick={onClick}
          className={styles.button}
          style={{ width }}
          {...props}
        >
          {children || text}
        </button>
      );
    case "plus":
      return (
        <button
          onClick={onClick}
          className={classNames(styles.button, styles.plus)}
          {...props}
        >
          <PlusIcon size={20} />
        </button>
      );
    case "minus":
      return (
        <button
          onClick={onClick}
          className={classNames(styles.button, styles.minus)}
          {...props}
        >
          <MinusIcon size={20} />
        </button>
      );
    case "arrow":
      return (
        <button
          onClick={onClick}
          className={classNames(styles.button, styles.arrow)}
          {...props}
        >
          <ArrowRightIcon size={20} />
        </button>
      );
    default:
      return null;
  }
};
