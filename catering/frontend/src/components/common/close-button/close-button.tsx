import React from "react";
import classNames from "classnames";
import styles from "./close-button.module.scss";

interface CloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  isAbsolute?: boolean;
}

export const CloseButton = ({
  className,
  onClick,
  isAbsolute = true,
  ...props
}: CloseButtonProps) => {
  return (
    <button
      className={classNames(
        styles.closeBtn,
        { [styles.absolute]: isAbsolute },
        className,
      )}
      onClick={onClick}
      aria-label="Close"
      {...props}
    >
      ✕
    </button>
  );
};
