"use client";

import { useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppActions, useAppState } from "@/context/app-context";
import { decodeCart } from "@/utils/cart-sharing";
import axiosInstance from "@/api/axiosInstance";
import { ProductData } from "@/components/blocks/catalog/product/product";
import { toast } from "react-hot-toast";

const CartShareHandlerInner = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setCartItems, setCartOpen } = useAppActions();
  const { isLoaded } = useAppState();
  const isProcessing = useRef(false);

  useEffect(() => {
    const cartParam = searchParams.get("cart");
    if (cartParam && isLoaded && !isProcessing.current) {
      isProcessing.current = true;

      const decodedItems = decodeCart(cartParam);
      if (decodedItems.length === 0) return;

      const fetchProducts = async () => {
        try {
          // Fetch all products to find shared items
          const response = await axiosInstance.get<any>("catalog/products/");
          const data = response.data;
          
          // Handle both direct array and paginated response { results: [] }
          const allProducts: ProductData[] = Array.isArray(data) ? data : (data?.results || []);

          if (allProducts.length === 0) {
            console.warn("No products found in catalog while processing shared cart");
          }

          const cartItems = decodedItems.map((item) => {
            const product = allProducts.find((p) => String(p.id) === String(item.id));

            if (product) {
              const selectedOption = item.optionId && product.options
                ? product.options.find(opt => String(opt.id) === String(item.optionId))
                : undefined;

              return {
                ...product,
                priceInfo: {
                  ...product.priceInfo,
                  price: selectedOption ? selectedOption.price : product.priceInfo?.price,
                  oldPrice: selectedOption ? selectedOption.oldPrice : product.priceInfo?.oldPrice,
                },
                productId: String(product.id),
                quantity: item.quantity,
                selectedOption,
                id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
              };
            }
            console.error(`Product ${item.id} not found in catalog`);
            return null;
          });

          const validItems = cartItems.filter((item) => item !== null);
          if (validItems.length > 0) {
            setCartItems(validItems as any);
            setCartOpen(true);
            toast.success("Cart loaded from the shared link!", {
              icon: "🛒",
              duration: 3000,
            });
          }

          // Clean up URL
          const newParams = new URLSearchParams(searchParams.toString());
          newParams.delete("cart");
          const newUrl = window.location.pathname + (newParams.toString() ? `?${newParams.toString()}` : "");
          router.replace(newUrl);
        } catch (error) {
          console.error("Failed to process shared cart:", error);
        } finally {
          isProcessing.current = false;
        }
      };

      fetchProducts();
    }
  }, [searchParams, isLoaded, setCartItems, setCartOpen, router]);

  return null;
};

export const CartShareHandler = () => {
  return (
    <Suspense fallback={null}>
      <CartShareHandlerInner />
    </Suspense>
  );
};
