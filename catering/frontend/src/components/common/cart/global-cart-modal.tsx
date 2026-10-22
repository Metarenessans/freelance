"use client";

import React from "react";
import { useAppState, useAppActions } from "@/context/app-context";
import { CartModal, CartSubmitData } from "./cart-modal";
import { useCreateOrderMutation } from "@/store/services/ordersApi";

export const GlobalCartModal = () => {
  const { isCartOpen } = useAppState();
  const { setCartOpen } = useAppActions();
  const [createOrder] = useCreateOrderMutation();

  const handleSubmit = async (data: CartSubmitData) => {
    return createOrder(data).unwrap();
  };

  return (
    <CartModal
      isOpen={isCartOpen}
      onClose={() => setCartOpen(false)}
      onSubmit={handleSubmit}
    />
  );
};
