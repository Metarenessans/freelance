import { NO_VALUE_TEMPLATE } from "@/constants";

/**
 * Format a phone number.
 * @param phone 89999999999
 * @returns 8 999 999-99-99
 */
export const formatPhoneNumber = (phone: string | number | null | undefined) => {
  if (!phone) return NO_VALUE_TEMPLATE;
  const cleaned = String(phone).replace(/\D/g, "");

  return cleaned.replace(
    /^(\d)(\d{3})(\d{3})(\d{2})(\d{2})$/,
    "+$1 $2 $3-$4-$5",
  );
};
