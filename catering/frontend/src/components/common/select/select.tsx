"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import styles from "./select.module.scss";

interface SelectProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  required?: boolean;
  className?: string;
  hasError?: boolean;
}

export const Select = ({
  value,
  onChange,
  options,
  placeholder,
  required,
  className = "",
  hasError,
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top: number;
    bottom: number;
    left: number;
    width: number;
    placeAbove: boolean;
  }>({
    top: 0,
    bottom: 0,
    left: 0,
    width: 0,
    placeAbove: false,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!selectRef.current) return;
    const rect = selectRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placeAbove = spaceBelow < 220 && spaceAbove > spaceBelow;

    const width = Math.min(rect.width, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));

    setCoords({
      top: rect.bottom + 6,
      bottom: window.innerHeight - rect.top + 6,
      left,
      width,
      placeAbove,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        selectRef.current &&
        !selectRef.current.contains(target) &&
        optionsRef.current &&
        !optionsRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen]);

  return (
    <div className={`${styles.container} ${className}`} ref={selectRef}>
      <div
        className={`${styles.trigger} ${isOpen ? styles.open : ""} ${
          !value ? styles.placeholder : ""
        } ${hasError ? styles.hasError : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span>{value || placeholder}</span>
        <div className={styles.arrow} />
      </div>
      {isOpen &&
        isMounted &&
        createPortal(
          <div
            ref={optionsRef}
            className={`${styles.options} ${coords.placeAbove ? styles.placeAbove : ""}`}
            style={{
              position: "fixed",
              ...(coords.placeAbove
                ? { bottom: `${coords.bottom}px` }
                : { top: `${coords.top}px` }),
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 99999,
            }}
          >
            {options.map((opt) => (
              <div
                key={opt}
                className={`${styles.option} ${value === opt ? styles.selected : ""}`}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
              >
                {opt}
              </div>
            ))}
          </div>,
          document.body
        )}
      <input type="hidden" value={value} required={required} />
    </div>
  );
};
