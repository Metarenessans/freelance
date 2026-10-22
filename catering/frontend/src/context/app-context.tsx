"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { ProductData } from "@/components/blocks/catalog/product/product";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { useGetCompanyInfoQuery } from "@/store/services/companyApi";
import { getProductPopupSlug } from "@/utils/slugify";

// Toggle flag to enable/disable all delivery logic (minimum order, delivery fees, progress bars)
export const IS_DELIVERY_ENABLED = process.env.NEXT_PUBLIC_PORTFOLIO_ORDERING_ENABLED === "true";

export const CART_STORAGE_KEY = "catering_cart_items";

export const LIKED_STORAGE_KEY = "catering_liked_items";

// ─── Cart ───────────────────────────────────────────────────────────

export type CartItem = ProductData & {
  id: string; // client-side unique id
  productId?: string; // original database id
  quantity: number;
  selectedOption?: {
    id: string;
    name: string;
    price: number;
    oldPrice?: number;
  };
};

// ─── Likes ──────────────────────────────────────────────────────────

export type LikedItem = ProductData;

export interface ProductModalOptions {
  showAddButton?: boolean;
  skipUrlUpdate?: boolean;
}

// ─── Context ────────────────────────────────────────────────────────

interface AppState {
  // Cart
  cartItems: CartItem[];
  cartTotalCount: number;
  cartTotalPrice: number;
  cartFinalPrice: number;

  // Likes (placeholder).
  likedItems: LikedItem[];

  // Global Product Modal
  selectedProduct: ProductData | null;
  productModalOptions?: ProductModalOptions;

  // Modals visibility
  isCartOpen: boolean;
  isMenuPopupOpen: boolean;
  isLoaded: boolean;
}

interface AppActions {
  addToCart: (product: ProductData) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number, removeIfZero?: boolean) => void;
  setQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setCartItems: (items: CartItem[]) => void;
  toggleLike: (product: ProductData) => void;
  isLiked: (product: ProductData) => boolean;
  openProductModal: (product: ProductData, options?: ProductModalOptions) => void;
  closeProductModal: () => void;

  // Modal actions
  setCartOpen: (isOpen: boolean) => void;
  setMenuPopupOpen: (isOpen: boolean) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppActionsContext = createContext<AppActions | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  // ── Cart state ──────────────────────────────────────────────────
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [likedItems, setLikedItems] = useState<LikedItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [productModalOptions, setProductModalOptions] = useState<ProductModalOptions>({ showAddButton: true });
  const productModalOptionsRef = useRef<ProductModalOptions>({ showAddButton: true });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuPopupOpen, setIsMenuPopupOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { data: companyInfo } = useGetCompanyInfoQuery();

  // ── Persistence ────────────────────────────────────────────────
  // Load from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    const savedLiked = localStorage.getItem(LIKED_STORAGE_KEY);
    const savedIsCartOpen = localStorage.getItem("catering_is_cart_open");
    const savedIsMenuPopupOpen = localStorage.getItem("catering_is_menu_popup_open");
    const savedSelectedProduct = localStorage.getItem("catering_selected_product");
    const savedProductModalOptions = localStorage.getItem("catering_product_modal_options");

    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse saved cart:", e);
      }
    }

    if (savedLiked) {
      try {
        setLikedItems(JSON.parse(savedLiked));
      } catch (e) {
        console.error("Failed to parse saved liked items:", e);
      }
    }

    if (savedIsCartOpen === "true") {
      setIsCartOpen(true);
    }

    if (savedIsMenuPopupOpen === "true") {
      setIsMenuPopupOpen(true);
    }

    if (savedSelectedProduct) {
      try {
        const isProductUrl =
          typeof window !== "undefined" &&
          (window.location.pathname.startsWith("/product/") ||
            window.location.hash.startsWith("#popup/product/") ||
            window.location.hash.startsWith("#product/"));
        if (isProductUrl) {
          setSelectedProduct(JSON.parse(savedSelectedProduct));
        } else {
          localStorage.removeItem("catering_selected_product");
        }
      } catch (e) {
        console.error("Failed to parse saved selected product:", e);
      }
    }

    if (savedProductModalOptions) {
      try {
        setProductModalOptions(JSON.parse(savedProductModalOptions));
      } catch (e) {
        console.error("Failed to parse saved product modal options:", e);
      }
    }

    setIsLoaded(true);
  }, []);

  // ── Sync modals with browser history (back/forward) ───────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash;

      const isProductUrl =
        pathname.startsWith("/product/") ||
        hash.startsWith("#popup/product/") ||
        hash.startsWith("#product/");

      // Close the product modal when the URL no longer selects a product.
      if (!isProductUrl) {
        setSelectedProduct((current) => (current ? null : current));
        setProductModalOptions({ showAddButton: true });
      }

      // Close the cart when it is no longer present in the URL.
      if (pathname !== "/cart" && hash !== "#cart") {
        setIsCartOpen((current) => (current ? false : current));
      }

      // Close the menu planner when it is no longer present in the URL.
      if (pathname !== "/calculate" && hash !== "#calculate") {
        setIsMenuPopupOpen((current) => (current ? false : current));
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handlePopState);
    };
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(likedItems));
  }, [likedItems, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("catering_is_cart_open", String(isCartOpen));
  }, [isCartOpen, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("catering_is_menu_popup_open", String(isMenuPopupOpen));
  }, [isMenuPopupOpen, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (selectedProduct) {
      localStorage.setItem("catering_selected_product", JSON.stringify(selectedProduct));
    } else {
      localStorage.removeItem("catering_selected_product");
    }
  }, [selectedProduct, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("catering_product_modal_options", JSON.stringify(productModalOptions));
  }, [productModalOptions, isLoaded]);

  const addToCart = useCallback((product: ProductData) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) =>
          item.name === product.name &&
          item.imageUrl === product.imageUrl &&
          item.selectedOption?.id === product.selectedOption?.id,
      );
      if (existing) {
        return prev.map((item) => {
          if (item.id === existing.id) {
            const itemMinQty = item.selectedOption?.minOrderQuantity !== undefined && item.selectedOption?.minOrderQuantity !== null
              ? item.selectedOption.minOrderQuantity
              : item.minOrderQuantity;
            const minQty = Number(itemMinQty) || 1;
            const targetQty = item.quantity === 0 ? minQty : item.quantity + 1;
            return { ...item, quantity: Math.min(999, targetQty) };
          }
          return item;
        });
      }
      const productMinQty = product.selectedOption?.minOrderQuantity !== undefined && product.selectedOption?.minOrderQuantity !== null
        ? product.selectedOption.minOrderQuantity
        : product.minOrderQuantity;
      return [
        ...prev,
        {
          ...product,
          priceInfo: {
            ...product.priceInfo,
            price: product.selectedOption ? product.selectedOption.price : product.priceInfo.price,
            oldPrice: product.selectedOption ? product.selectedOption.oldPrice : product.priceInfo.oldPrice,
          },
          productId: (product as any).productId || product.id,
          quantity: Number(productMinQty) || 1,
          id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, delta: number, removeIfZero?: boolean) => {
    setCartItems((prev) => {
      let updated = prev.map((item) => {
        if (item.id === id) {
          const itemMinQty = item.selectedOption?.minOrderQuantity !== undefined && item.selectedOption?.minOrderQuantity !== null
            ? item.selectedOption.minOrderQuantity
            : item.minOrderQuantity;
          const minQty = Number(itemMinQty) || 1;
          let newQ = item.quantity + delta;
          if (delta > 0 && item.quantity === 0) {
            newQ = minQty;
          } else if (newQ < minQty) {
            newQ = 0;
          } else {
            newQ = Math.min(999, newQ);
          }
          return { ...item, quantity: newQ };
        }
        return item;
      });
      if (removeIfZero) {
        updated = updated.filter(item => !(item.id === id && item.quantity === 0));
      }
      return updated;
    });
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    setCartItems((prev) => {
      return prev.map((item) => {
        if (item.id === id) {
          const finalQ = Math.min(999, Math.max(0, quantity));
          return { ...item, quantity: finalQ };
        }
        return item;
      });
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const setCartItemsAction = useCallback((items: CartItem[]) => {
    setCartItems(items);
  }, []);

  const cartTotalCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const cartTotalPrice = cartItems.reduce(
    (sum, item) => sum + item.priceInfo.price * item.quantity,
    0,
  );

  const DELIVERY_THRESHOLD = companyInfo?.freeDeliveryThreshold ?? 10000;
  const DELIVERY_COST = companyInfo?.deliveryCost ?? 1500;
  const cartFinalPrice = cartItems.length > 0
    ? cartTotalPrice + (IS_DELIVERY_ENABLED && cartTotalPrice < DELIVERY_THRESHOLD ? DELIVERY_COST : 0)
    : 0;


  // ── Likes state ─────────────────────────────────────────────────

  const toggleLike = useCallback((product: ProductData) => {
    setLikedItems((prev) => {
      const exists = prev.some(
        (item) =>
          item.name === product.name && item.imageUrl === product.imageUrl,
      );
      if (exists) {
        return prev.filter(
          (item) =>
            !(item.name === product.name && item.imageUrl === product.imageUrl),
        );
      }
      return [...prev, product];
    });
  }, []);

  const isLiked = useCallback(
    (product: ProductData) => {
      return likedItems.some(
        (item) =>
          item.name === product.name && item.imageUrl === product.imageUrl,
      );
    },
    [likedItems],
  );

  // ── Global Modal state ──────────────────────────────────────────

  const openProductModal = useCallback((product: ProductData, options?: ProductModalOptions) => {
    const effectiveOptions = options ?? { showAddButton: true };
    productModalOptionsRef.current = effectiveOptions;
    setSelectedProduct(product);
    setProductModalOptions(effectiveOptions);

    if (!effectiveOptions.skipUrlUpdate && typeof window !== "undefined") {
      const slug = getProductPopupSlug(product);
      const targetPath = `/product/${slug}`;
      const currentFullPath = window.location.pathname + window.location.search;

      if (window.location.pathname !== targetPath) {
        const returnUrl = window.location.pathname.startsWith('/product/')
          ? ((window.history.state && window.history.state.returnUrl) || '/')
          : currentFullPath;

        window.history.pushState(
          { popupProduct: product.id, returnUrl },
          "",
          targetPath
        );
      }
    }
  }, []);

  const closeProductModal = useCallback(() => {
    setSelectedProduct(null);
    const options = productModalOptionsRef.current;
    productModalOptionsRef.current = { showAddButton: true };
    setProductModalOptions({ showAddButton: true });

    if (!options?.skipUrlUpdate && typeof window !== "undefined") {
      if (window.location.pathname.startsWith('/product/')) {
        const state = window.history.state;
        const returnUrl = (state && state.returnUrl) ? state.returnUrl : '/';

        if (state && state.popupProduct && window.history.length > 1) {
          window.history.back();
        } else {
          window.history.replaceState(null, '', returnUrl);
        }
      } else if (
        window.location.hash.startsWith("#popup/product/") ||
        window.location.hash.startsWith("#product/")
      ) {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}`
        );
      }
    }
  }, []);

  const setCartOpen = useCallback((isOpen: boolean) => {
    setIsCartOpen(isOpen);

    if (typeof window !== "undefined") {
      if (isOpen) {
        if (window.location.pathname !== "/cart") {
          const currentFullPath = window.location.pathname + window.location.search;
          const returnUrl =
            window.location.pathname === "/cart" ||
            window.location.pathname === "/calculate" ||
            window.location.pathname.startsWith("/product/")
              ? "/"
              : currentFullPath;

          window.history.pushState(
            { isCartModal: true, returnUrl },
            "",
            "/cart"
          );
        }
      } else {
        if (window.location.pathname === "/cart") {
          const state = window.history.state;
          const returnUrl = state && state.returnUrl ? state.returnUrl : "/";

          if (state && state.isCartModal && window.history.length > 1) {
            window.history.back();
          } else {
            window.history.replaceState(null, "", returnUrl);
          }
        }
      }
    }
  }, []);

  const setMenuPopupOpen = useCallback((isOpen: boolean) => {
    setIsMenuPopupOpen(isOpen);

    if (typeof window !== "undefined") {
      if (isOpen) {
        if (window.location.pathname !== "/calculate") {
          const currentFullPath = window.location.pathname + window.location.search;
          const returnUrl =
            window.location.pathname === "/calculate" ||
            window.location.pathname === "/cart" ||
            window.location.pathname.startsWith("/product/")
              ? "/"
              : currentFullPath;

          window.history.pushState(
            { isMenuModal: true, returnUrl },
            "",
            "/calculate"
          );
        }
      } else {
        if (window.location.pathname === "/calculate") {
          const state = window.history.state;
          const returnUrl = state && state.returnUrl ? state.returnUrl : "/";

          if (state && state.isMenuModal && window.history.length > 1) {
            window.history.back();
          } else {
            window.history.replaceState(null, "", returnUrl);
          }
        }
      }
    }
  }, []);

  // ── Scroll Lock ──────────────────────────────────────────────────
  useScrollLock(isCartOpen || !!selectedProduct || isMenuPopupOpen);

  const state = useMemo<AppState>(
    () => ({
      cartItems,
      cartTotalCount,
      cartTotalPrice,
      cartFinalPrice,
      likedItems,
      selectedProduct,
      productModalOptions,
      isCartOpen,
      isMenuPopupOpen,
      isLoaded,
    }),
    [
      cartItems,
      cartTotalCount,
      cartTotalPrice,
      cartFinalPrice,
      likedItems,
      selectedProduct,
      productModalOptions,
      isCartOpen,
      isMenuPopupOpen,
      isLoaded,
    ],
  );

  const actions = useMemo<AppActions>(
    () => ({
      addToCart,
      removeFromCart,
      updateQuantity,
      setQuantity,
      clearCart,
      setCartItems: setCartItemsAction,
      toggleLike,
      isLiked,
      openProductModal,
      closeProductModal,
      setCartOpen,
      setMenuPopupOpen,
    }),
    [
      addToCart,
      removeFromCart,
      updateQuantity,
      setQuantity,
      clearCart,
      toggleLike,
      isLiked,
      openProductModal,
      closeProductModal,
      setCartOpen,
      setMenuPopupOpen,
    ],
  );

  return (
    <AppStateContext.Provider value={state}>
      <AppActionsContext.Provider value={actions}>
        {children}
      </AppActionsContext.Provider>
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppProvider");
  }
  return context;
};

export const useAppActions = () => {
  const context = useContext(AppActionsContext);
  if (!context) {
    throw new Error("useAppActions must be used within an AppProvider");
  }
  return context;
};

// Deprecated: use useAppState and useAppActions instead for better performance
export const useAppContext = () => {
  const state = useAppState();
  const actions = useAppActions();
  return { ...state, ...actions };
};
