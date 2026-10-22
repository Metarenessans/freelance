/**
 * Format a number as a price.
 * @param num 6000
 * @returns 6 000
 */
export const formatPrice = (num: number | null | undefined) => {
  const hasValue = num === 0 || !num;
  const formattedValue = new Intl.NumberFormat("en-US").format(num ?? 0);
  return hasValue ? 0 : formattedValue;
};
