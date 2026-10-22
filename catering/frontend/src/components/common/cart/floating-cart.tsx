"use client";

import React from "react";
import styles from "./floating-cart.module.scss";
import { useAppState, useAppActions } from "@/context/app-context";
import { AnimatedNumber } from "@/components/common/animated-number/animated-number";

export const FloatingCart = () => {
  const { cartItems, cartFinalPrice, isCartOpen } = useAppState();
  const { setCartOpen } = useAppActions();

  if (cartItems.length === 0 && !isCartOpen) return null;

  return (
    <>
      {/* Floating Toggle Button */}
      {cartItems.length > 0 && (
        <div className={styles.wrapper} onClick={() => setCartOpen(true)}>
          <div className={styles.content}>
            <span className={styles.text}>cart</span>
            <AnimatedNumber
              value={cartFinalPrice}
              suffix=" ₽"
              className={styles.price}
            />
          </div>
        </div>
      )}
    </>
  );
};
