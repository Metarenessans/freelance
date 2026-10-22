import { CartItem } from "@/context/app-context";

/**
 * Encodes cart items into a compact string format: id:qty:optionId,id:qty
 */
export const encodeCart = (items: CartItem[]): string => {
  return items
    .map((item) => {
      const idToUse = item.productId || item.id;
      const optionPart = item.selectedOption?.id ? `:${item.selectedOption.id}` : "";
      return `${idToUse}:${item.quantity}${optionPart}`;
    })
    .join(",");
};

/**
 * Decodes a cart string into an array of { id, quantity, optionId }
 */
export const decodeCart = (cartStr: string): { id: string; quantity: number; optionId?: string }[] => {
  if (!cartStr) return [];

  return cartStr
    .split(",")
    .filter((part) => part.trim() !== "")
    .map((part) => {
      const [id, qty, optionId] = part.split(":");
      return {
        id: id.trim(),
        quantity: parseInt(qty, 10) || 1,
        optionId: optionId?.trim(),
      };
    })
    .filter((item) => item.id !== "");
};

/**
 * Generates a full shareable URL
 */
export const getShareableCartUrl = (items: CartItem[]): string => {
  const encoded = encodeCart(items);
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  url.searchParams.set("cart", encoded);
  return url.toString();
};
