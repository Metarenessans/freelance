import React, { useState, useCallback, useRef, useEffect } from "react";
import styles from "./product-modal.module.scss";
import { useAppActions } from "@/context/app-context";
import { formatPrice } from "@/utils/formatPrice";
import { ProductData } from "@/components/blocks/catalog/product/product";

import { Drawer } from "vaul";
import { useMobile } from "@/hooks/useMobile";
import { Image } from "@/components/common/image/image";
import { CloseButton } from "@/components/common/close-button/close-button";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { ShareIcon } from "@/components/icons";
import { getProductPopupSlug } from "@/utils/slugify";
import toast from "react-hot-toast";
import { useModalScreenshot } from "@/hooks/use-modal-screenshot";
import { getProductAltText } from "@/utils/seo";

export interface ProductModalProps {
  data: ProductData;
  isOpen: boolean;
  onClose: () => void;
  showAddButton?: boolean;
}

export const ProductModal = ({
  data,
  isOpen,
  onClose,
  showAddButton = true
}: ProductModalProps) => {
  const { addToCart } = useAppActions();
  const isMobile = useMobile();

  const [selectedOption, setSelectedOption] = useState<any>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const clickCount = useRef(0);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);

  const captureProductScreenshot = useModalScreenshot(modalRef, {
    filename: () => data?.name || "product",
    scale: 2,
  });

  const handleTitleClick = (e: React.MouseEvent) => {
    if (e.detail === 3) {
      if (clickTimer.current) clearTimeout(clickTimer.current);
      clickCount.current = 0;
      captureProductScreenshot();
      return;
    }

    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickCount.current += 1;

    if (clickCount.current >= 3) {
      clickCount.current = 0;
      captureProductScreenshot();
    } else {
      clickTimer.current = setTimeout(() => {
        clickCount.current = 0;
      }, 700);
    }
  };

  useEscapeKey(onClose, isOpen);

  useEffect(() => {
    if (isOpen && data?.options && data.options.length > 0) {
      setSelectedOption(data.options[0]);
    } else {
      setSelectedOption(null);
    }
  }, [isOpen, data]);

  if (!isOpen && !isMobile) return null;

  const { name, imageUrl, priceInfo, extraInfo, description, options, minOrderQuantity } = data;
  const { price, oldPrice } = priceInfo ?? {};
  const hasOptions = options && options.length > 0;

  // Compute active price depending on options
  const activePrice = selectedOption ? selectedOption.price : price;
  const activeOldPrice = selectedOption ? selectedOption.oldPrice : oldPrice;

  // Compute active minOrderQuantity depending on options
  const activeMinOrderQuantity = selectedOption
    ? (selectedOption.minOrderQuantity !== undefined && selectedOption.minOrderQuantity !== null ? selectedOption.minOrderQuantity : minOrderQuantity)
    : minOrderQuantity;

  // Calculate total price to add to cart (multiplied by minOrderQuantity for piece items)
  const displayPrice = activeMinOrderQuantity ? activePrice * Number(activeMinOrderQuantity) : activePrice;

  const extraInfoText = (extraInfo ?? [])
    .map(({ amount, unit }) => `${amount ?? ""} ${unit ?? ""}`)
    .join(" · ");

  const handleAdd = () => {
    addToCart({
      ...data,
      selectedOption: selectedOption || undefined,
    });
    onClose();
  };

  const fallbackCopy = (text: string, callback: () => void) => {
    let successful = false;
    const textArea = document.createElement("textarea");
    textArea.value = text;

    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    textArea.style.top = (window.pageYOffset || document.documentElement.scrollTop) + "px";
    textArea.setAttribute("readonly", "");

    document.body.appendChild(textArea);

    const isIOS = navigator.userAgent.match(/ipad|iphone/i);
    if (isIOS) {
      const range = document.createRange();
      range.selectNodeContents(textArea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textArea.setSelectionRange(0, 999999);
    } else {
      textArea.focus();
      textArea.select();
    }

    try {
      successful = document.execCommand("copy");
    } catch (err) {
      console.error("Fallback copy execution failed:", err);
    }

    document.body.removeChild(textArea);

    if (successful) {
      callback();
    }
  };

  const handleShare = () => {
    if (!data) return;
    const slug = getProductPopupSlug(data);
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/product/${slug}`
        : `/product/${slug}`;

    const onSuccess = () => {
      toast.success("Product link copied!", {
        duration: 3000,
        style: {
          borderRadius: "12px",
          background: "#333",
          color: "#fff",
        },
        iconTheme: {
          primary: "#34c759",
          secondary: "#fff",
        },
      });
    };

    const copyToClipboard = () => {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard
          .writeText(url)
          .then(onSuccess)
          .catch((err) => {
            console.error("Clipboard write failed:", err);
            fallbackCopy(url, onSuccess);
          });
      } else {
        fallbackCopy(url, onSuccess);
      }
    };

    if (isMobile && navigator.share) {
      navigator
        .share({
          title: `${name} | Chef Meal Catering`,
          text: description ? description.slice(0, 100) : name,
          url: url,
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            console.error("Web Share API failed:", err);
            copyToClipboard();
          }
        });
    } else {
      copyToClipboard();
    }
  };

  const modalContent = (
    <>
      <div className={styles.dragHandle} aria-hidden="true" />
      <div className={styles.topActions}>
        <button
          type="button"
          className={styles.shareBtn}
          onClick={handleShare}
          title="Share product"
          aria-label="Share product"
        >
          <ShareIcon size={18} />
        </button>
        <CloseButton onClick={onClose} isAbsolute={false} />
      </div>
      <article className={styles.innerModal} aria-label={name}>
        <Image
          src={imageUrl}
          alt={getProductAltText(data, selectedOption?.name)}
          className={styles.image}
          wrapperClassName={styles.imageWrap}
        />

        <div className={styles.infoWrapper}>
          <div className={styles.info}>
            <h2
              className={styles.name}
              onClick={handleTitleClick}
              style={{ cursor: "pointer", userSelect: "none" }}
              title="Triple-click to take a screenshot"
            >
              {name}
            </h2>

            <div className={styles.priceRow}>
              {activeOldPrice && (
                <span className={styles.oldPrice}>
                  {formatPrice(activeOldPrice)} ₽
                </span>
              )}
              <span className={styles.price}>
                {formatPrice(activePrice)} ₽
                {activeMinOrderQuantity && (
                  <span className={styles.priceUnit}>
                    each
                  </span>
                )}
              </span>
            </div>

            {!hasOptions && extraInfoText && (
              <span className={styles.extraInfo}>{extraInfoText}</span>
            )}

            {hasOptions && (
              <div className={styles.optionsContainer}>
                {options.map((opt) => {
                  const isSelected = selectedOption?.id === opt.id;
                  return (
                    <div
                      key={opt.id}
                      className={`${styles.optionRow} ${isSelected ? styles.optionRowSelected : ""
                        }`}
                      onClick={() => setSelectedOption(opt)}
                    >
                      <div className={styles.radioWrapper}>
                        <div
                          className={`${styles.radioCircle} ${isSelected ? styles.radioCircleActive : ""
                            }`}
                        >
                          {isSelected && <div className={styles.radioDot} />}
                        </div>
                        <span className={styles.optionName}>{opt.name}</span>
                      </div>
                      <span className={styles.optionPrice}>
                        {formatPrice(opt.price)} ₽
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {description && (
              <p className={styles.description}>{description}</p>
            )}
          </div>
          {showAddButton && (
            <button className={styles.addBtn} onClick={handleAdd}>
              add for {formatPrice(displayPrice)} ₽
            </button>
          )}
        </div>
      </article>
    </>
  );

  if (isMobile) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()} repositionInputs={false}>
        <Drawer.Portal>
          <Drawer.Overlay className={styles.overlay} />
          <Drawer.Content ref={modalRef} className={styles.modal} aria-describedby={undefined}>
            <Drawer.Title style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", borderWidth: 0 }}>
              {name}
            </Drawer.Title>
            {modalContent}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.stopPropagation();
          onClose();
        }
      }}
      aria-modal="true"
      role="dialog"
    >
      <div ref={modalRef} className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {modalContent}
      </div>
    </div>
  );
};
