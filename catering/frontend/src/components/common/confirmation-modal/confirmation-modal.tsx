"use client";

import React, { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import styles from "./confirmation-modal.module.scss";
import { useEscapeKey } from "@/hooks/use-escape-key";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const emptySubscribe = () => () => {};

export const ConfirmationModal = ({
  isOpen,
  title,
  confirmText = "Remove",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmationModalProps) => {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEscapeKey(onCancel, isOpen);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className={styles.overlay}
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
      role="dialog"
      aria-modal="true"
      data-vaul-no-drag
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        data-vaul-no-drag
      >
        <div className={styles.title}>{title}</div>
        <div className={styles.buttons}>
          <button
            className={styles.confirmBtn}
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
            type="button"
          >
            {confirmText}
          </button>
          <button
            className={styles.cancelBtn}
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            type="button"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
