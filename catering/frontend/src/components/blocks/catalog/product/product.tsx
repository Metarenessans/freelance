import React, { memo } from "react";
import { Button } from "@/components/common/button/button";
import { Image } from "@/components/common/image/image";
import styles from "./product.module.scss";
import { NO_VALUE_TEMPLATE } from "@/constants";
import { formatPrice } from "@/utils/formatPrice";
import { useAppActions, useAppState } from "@/context/app-context";
import { getProductAltText } from "@/utils/seo";

export type ProductData = {
  id: string;
  slug?: string;
  name: string;
  categoryId?: string;
  extraInfo: { amount: number; unit: string }[];
  description?: string;
  priceInfo: { price: number; oldPrice?: number };
  imageUrl: string;
  options?: { id: string; name: string; price: number; oldPrice?: number; minOrderQuantity?: number | null }[];
  selectedOption?: { id: string; name: string; price: number; oldPrice?: number; minOrderQuantity?: number | null };
  minOrderQuantity?: number | null;
};

export interface ProductProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onClick"
> {
  data: ProductData;
  onClick?: (data: ProductData) => void;
  onAddToCart?: (data: ProductData) => void;
  priority?: boolean;
}

export const Product = memo(({
  data,
  onClick,
  onAddToCart,
  priority,
  ...props
}: ProductProps) => {
  const { openProductModal, updateQuantity } = useAppActions();
  const { cartItems } = useAppState();

  const { name, extraInfo, priceInfo, imageUrl } = data ?? {};
  const { price, oldPrice } = priceInfo ?? {};
  const extraInfoText =
    (extraInfo ?? [])
      .map(({ amount, unit }) => `${amount ?? ""} ${unit ?? ""}`)
      .join(" / ") ?? NO_VALUE_TEMPLATE;

  const handleOpenModal = () => {
    openProductModal(data);
    onClick?.(data);
  };

  const hasOptions = data?.options && data.options.length > 0;
  const minPrice = hasOptions
    ? Math.min(...data.options!.map((o) => o.price))
    : price;

  const cartItemCount = cartItems
    .filter((item) => item.name === name && item.imageUrl === imageUrl)
    .reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <article className={styles.product} onClick={handleOpenModal} {...props}>
        <div className={styles.imageContainer}>
          <Image
            src={imageUrl}
            alt={getProductAltText(data)}
            wrapperClassName={styles.imageWrapper}
            priority={priority}
          />
          {cartItemCount > 0 && (
            <div className={styles.quantityOverlay}>{cartItemCount}</div>
          )}
        </div>

        <div className={styles.info}>
          <h3 className={styles.name}>{name ?? NO_VALUE_TEMPLATE}</h3>

          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <div className={styles.priceInfo}>
                {!hasOptions && oldPrice && (
                  <span className={styles.oldPrice}>
                    {formatPrice(oldPrice)}
                  </span>
                )}
                {minPrice && (
                  <span className={styles.price}>
                    {hasOptions ? "from " : ""}
                    {formatPrice(minPrice)}₽
                  </span>
                )}
              </div>
              {!hasOptions && <span className={styles.extraInfo}>{extraInfoText}</span>}
            </div>
            <div className={styles.actions}>
              {hasOptions ? (
                <Button
                  type="arrow"
                  onClick={(e) => {
                    e?.stopPropagation();
                    handleOpenModal();
                  }}
                />
              ) : (
                <>
                  {cartItemCount > 0 && (
                    <Button
                      type="minus"
                      onClick={(e) => {
                        e?.stopPropagation();
                        const itemToDecrease = cartItems.find(
                          (item) => item.name === name && item.imageUrl === imageUrl
                        );
                        if (itemToDecrease) {
                          updateQuantity(itemToDecrease.id, -1, true);
                        }
                      }}
                    />
                  )}
                  <Button
                    type="plus"
                    onClick={(e) => {
                      e?.stopPropagation();
                      if (onAddToCart) {
                        onAddToCart(data);
                      } else {
                        handleOpenModal();
                      }
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </article>
    </>
  );
});

Product.displayName = "Product";
