import React, { useState, useRef, useEffect } from "react";
import { animate, motion, useMotionValue, PanInfo } from "framer-motion";
import classNames from "classnames";
import styles from "./cart-modal.module.scss";
import { useAppState, useAppActions, IS_DELIVERY_ENABLED } from "@/context/app-context";
import { formatPrice } from "@/utils/formatPrice";
import { getProductAltText } from "@/utils/seo";
import { Drawer } from "vaul";
import { useMobile } from "@/hooks/useMobile";
import { Image } from "@/components/common/image/image";
import { AnimatedNumber } from "@/components/common/animated-number/animated-number";
import { ConfirmationModal } from "@/components/common/confirmation-modal/confirmation-modal";
import { CloseButton } from "@/components/common/close-button/close-button";
import { ShareIcon } from "@/components/icons";
import { getShareableCartUrl } from "@/utils/cart-sharing";
import { toast } from "react-hot-toast";
import { IMaskInput } from "react-imask";
import { Select } from "@/components/common/select/select";
import { SuccessCheckmark } from "@/components/common/success-checkmark/success-checkmark";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { useElementScreenshot } from "@/hooks/use-element-screenshot";
import { DatePicker } from "@/components/common/date-picker/date-picker";
import { ProtectedZone } from "@/components/common/error-boundary/ProtectedZone";
import { useGetCompanyInfoQuery } from "@/store/services/companyApi";
import { useRouter } from "next/navigation";
import { isDateInPast } from "@/utils/date";

const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';
const IS_SANDBOX = process.env.NEXT_PUBLIC_PORTFOLIO_ORDERING_ENABLED === 'true';
const IS_READ_ONLY = IS_DEMO_MODE && !IS_SANDBOX;

export interface CartSubmitItem {
  id: string;
  productId: number | null;
  name: string;
  imageUrl: string;
  priceInfo: { price: number };
  quantity: number;
  selectedOption?: { id: string };
}

export interface CartSubmitData {
  items: CartSubmitItem[];
  name: string;
  phone: string;
  contact_method: string;
  cart_link?: string;
  guests?: string;
  event_date?: string | null;
}

export interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: CartSubmitData) => unknown | Promise<unknown>;
}

interface SwipeableCartItemProps {
  onDelete: () => void;
  onClick: () => void;
  children: React.ReactNode;
  isOpenState?: boolean;
  onOpen?: () => void;
}

const SwipeableCartItem = ({ onDelete, onClick, children, isOpenState, onOpen }: SwipeableCartItemProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [isOpen, setIsOpen] = useState(false);
  const maxSwipe = -80;

  useEffect(() => {
    if (isOpenState === false && isOpen) {
      animate(x, 0, { type: "spring", bounce: 0, duration: 0.3 });
      setTimeout(() => setIsOpen(false), 0);
    }
  }, [isOpenState, isOpen, x]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const currentX = x.get();
    const velocityX = info.velocity.x;
    const containerWidth = containerRef.current?.offsetWidth || 300;
    const threshold = -(containerWidth * 0.2); // 20% of width

    const springConfig = { type: "spring" as const, bounce: 0, duration: 0.3, velocity: velocityX };

    if (isOpen) {
      if (velocityX > 300 || currentX > -40) {
        animate(x, 0, springConfig);
        setIsOpen(false);
      } else {
        animate(x, maxSwipe, springConfig);
      }
    } else {
      if (velocityX < -300 || currentX < threshold) {
        animate(x, maxSwipe, springConfig);
        setIsOpen(true);
        onOpen?.();
      } else {
        animate(x, 0, springConfig);
      }
    }
  };

  const closeSwipe = () => {
    animate(x, 0, { type: "spring", bounce: 0, duration: 0.3 });
    setIsOpen(false);
  };

  return (
    <div className={styles.swipeContainer} ref={containerRef} data-vaul-no-drag>
      <button
        className={styles.swipeDeleteBtn}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
          closeSwipe();
        }}
        title="Remove item"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </button>

      <motion.div
        className={styles.item}
        drag="x"
        dragDirectionLock
        dragMomentum={false}
        dragConstraints={{ left: maxSwipe, right: 0 }}
        dragElastic={{ left: 0.15, right: 0.15 }}
        style={{ x, touchAction: "pan-y" }}
        onDragStart={() => onOpen?.()}
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          if (isOpen) {
            e.stopPropagation();
            e.preventDefault();
            closeSwipe();
            return;
          }
          // If the item has been dragged significantly, prevent accidental details click
          if (Math.abs(x.get()) > 5) {
            e.stopPropagation();
            e.preventDefault();
            return;
          }
          onClick();
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export const CartModal = ({ isOpen, onClose, onSubmit }: CartModalProps) => {
  const { cartItems, cartTotalPrice, cartFinalPrice } = useAppState();
  const {
    updateQuantity,
    setQuantity,
    clearCart,
    removeFromCart,
    openProductModal,
  } = useAppActions();

  const isMobile = useMobile();
  const router = useRouter();

  const { data: companyInfo } = useGetCompanyInfoQuery();
  const MIN_ORDER = companyInfo?.minOrderAmount ?? 5000;
  const DELIVERY_THRESHOLD = companyInfo?.freeDeliveryThreshold ?? 10000;
  const DELIVERY_COST = companyInfo?.deliveryCost ?? 1500;

  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contactMethod, setContactMethod] = useState("Call me");
  const [consent, setConsent] = useState(true);
  const [guests, setGuests] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [dateError, setDateError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (IS_DEMO_MODE || IS_SANDBOX) {
        // Remove only legacy checkout data, never persisted cart products.
        try {
          for (const key of ["step", "name", "phone", "contact_method", "consent", "guests", "event_date"]) {
            localStorage.removeItem(`cart_form_${key}`);
          }
        } catch {
          // Storage may be unavailable; demo must still never read or write it.
        }
        setIsLoaded(true);
        return;
      }
      const savedStep = localStorage.getItem("cart_form_step");
      if (savedStep) setStep(parseInt(savedStep, 10) || 1);

      const savedName = localStorage.getItem("cart_form_name");
      if (savedName) setName(savedName);

      const savedPhone = localStorage.getItem("cart_form_phone");
      if (savedPhone) setPhone(savedPhone);

      const savedMethod = localStorage.getItem("cart_form_contact_method");
      if (savedMethod) setContactMethod(savedMethod);

      const savedConsent = localStorage.getItem("cart_form_consent");
      if (savedConsent !== null) setConsent(savedConsent !== "false");

      const savedGuests = localStorage.getItem("cart_form_guests");
      if (savedGuests) setGuests(savedGuests);

      const savedEventDate = localStorage.getItem("cart_form_event_date");
      if (savedEventDate && savedEventDate !== "null" && savedEventDate !== "undefined") {
        if (!isDateInPast(savedEventDate)) {
          setEventDate(savedEventDate);
        } else {
          localStorage.removeItem("cart_form_event_date");
        }
      }

      const params = new URLSearchParams(window.location.search);
      if (params.get("success") === "order") {
        setShowSuccess(true);
      }

      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage when form state changes
  React.useEffect(() => {
    if (IS_DEMO_MODE || IS_SANDBOX || !isLoaded || typeof window === "undefined") return;
    localStorage.setItem("cart_form_step", String(step));
    localStorage.setItem("cart_form_name", name);
    localStorage.setItem("cart_form_phone", phone);
    localStorage.setItem("cart_form_contact_method", contactMethod);
    localStorage.setItem("cart_form_consent", String(consent));
    localStorage.setItem("cart_form_guests", guests);
    localStorage.setItem("cart_form_event_date", eventDate);
  }, [step, name, phone, contactMethod, consent, guests, eventDate, isLoaded]);

  const isFieldInvalid = (field: string) => {
    if (field === "name") return !name.trim();
    if (field === "phone") {
      return !phone || phone.length < 18;
    }
    if (field === "contactMethod") return !contactMethod;
    return false;
  };

  const [confirmItem, setConfirmItem] = useState<{
    id: string;
    name: string;
    onKeep?: () => void;
  } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const isIgnoringClick = useRef(false);
  const isAdjustingQuantity = useRef(false);

  const itemsListRef = useRef<HTMLDivElement>(null);
  const clickCount = useRef(0);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);

  const captureCartScreenshot = useElementScreenshot(itemsListRef, {
    backgroundColor: "#ffffff",
    scale: 2,
    clipboardText: () => `Total: ${formatPrice(cartFinalPrice)} ₽`,
  });

  const handleHeaderClick = (e: React.MouseEvent) => {
    const formattedTotal = `Total: ${formatPrice(cartFinalPrice)} ₽`;

    if (e.detail === 3) {
      if (clickTimer.current) clearTimeout(clickTimer.current);
      clickCount.current = 0;
      captureCartScreenshot(formattedTotal);
      return;
    }

    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickCount.current += 1;

    if (clickCount.current >= 3) {
      clickCount.current = 0;
      captureCartScreenshot(formattedTotal);
    } else {
      clickTimer.current = setTimeout(() => {
        clickCount.current = 0;
      }, 700);
    }
  };

  const handleClose = () => {
    if (showSuccess) {
      setShowSuccess(false);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("success");
        window.history.replaceState(null, "", url.pathname + (url.search || ""));
      }
    }
    setSubmitAttempted(false);
    onClose();
  };

  useEscapeKey(handleClose, isOpen);

  if (!isOpen && !isMobile) return null;

  const isDeliveryAvailable = IS_DELIVERY_ENABLED ? cartTotalPrice >= DELIVERY_THRESHOLD : false;

  const deliveryRemaining = IS_DELIVERY_ENABLED ? Math.max(DELIVERY_THRESHOLD - cartTotalPrice, 0) : 0;

  const isMinOrderReached = cartTotalPrice >= MIN_ORDER;
  const minOrderRemaining = Math.max(MIN_ORDER - cartTotalPrice, 0);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (IS_READ_ONLY) {
      toast.error("Read-only demo: orders and contact collection are disabled.");
      return;
    }
    setSubmitAttempted(true);

    const hasErrors =
      isFieldInvalid("name") ||
      isFieldInvalid("phone") ||
      isFieldInvalid("contactMethod") ||
      !consent;
    if (hasErrors) {
      toast.error(
        <div style={{ textAlign: "center", width: "100%" }}>
          Almost done!
          <br />
          Please complete the remaining fields
        </div>,
        {
          id: "validation-error",
        }
      );
      return;
    }

    if (eventDate && isDateInPast(eventDate)) {
      setEventDate("");
      setDateError(true);
      toast.error("The date cannot be in the past", {
        id: "date-past-error",
      });
      return;
    }

    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit({
          items: cartItems.map(item => ({
            id: item.id,
            productId: item.productId ? (parseInt(item.productId, 10) || null) : null,
            name: item.name + (item.selectedOption ? ` (${item.selectedOption.name})` : ""),
            imageUrl: item.imageUrl,
            priceInfo: item.priceInfo,
            quantity: item.quantity,
            selectedOption: item.selectedOption ? { id: item.selectedOption.id } : undefined,
          })),
          name,
          phone,
          contact_method: contactMethod,
          cart_link: getShareableCartUrl(cartItems),
          guests: guests || undefined,
          event_date: (eventDate && eventDate !== "null" && eventDate !== "undefined") ? eventDate : null,
        });

        setShowSuccess(true);
        if (!IS_SANDBOX && typeof window !== "undefined") {
          window.history.replaceState({ isCartModal: true }, "", "/?success=order");
        }

        // Reset the form and step only after a successful order.
        setStep(1);
        setName("");
        setPhone("");
        setContactMethod("Call me");
        setConsent(true);
        setSubmitAttempted(false);
        setDateError(false);
        setGuests("");
        setEventDate("");

        if (typeof window !== "undefined") {
          localStorage.removeItem("cart_form_step");
          localStorage.removeItem("cart_form_name");
          localStorage.removeItem("cart_form_phone");
          localStorage.removeItem("cart_form_contact_method");
          localStorage.removeItem("cart_form_consent");
          localStorage.removeItem("cart_form_guests");
          localStorage.removeItem("cart_form_event_date");
        }

        clearCart();
      } catch (error) {
        toast.error("Could not place your order. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const deliveryProgress = Math.min((cartTotalPrice / DELIVERY_THRESHOLD) * 100, 100);

  const handleShare = () => {
    const url = getShareableCartUrl(cartItems);

    const onSuccess = () => {
      toast.success("Cart link copied!", {
        duration: 3000,
        style: {
          borderRadius: '12px',
          background: '#333',
          color: '#fff',
        },
        iconTheme: {
          primary: '#34c759',
          secondary: '#fff',
        },
      });
    };

    const copyToClipboard = () => {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(onSuccess).catch((err) => {
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
          title: "My cart | Chef Meal Catering",
          text: "Take a look at my event menu!",
          url: url,
        })
        .catch((err) => {
          // If the user cancelled sharing (AbortError), we do nothing.
          // Otherwise, we fall back to clipboard copy.
          if (err.name !== "AbortError") {
            console.error("Web Share API failed:", err);
            copyToClipboard();
          }
        });
    } else {
      copyToClipboard();
    }
  };

  const fallbackCopy = (text: string, callback: () => void) => {
    let successful = false;
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Use a more robust way to hide the element while keeping it "copyable"
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    textArea.style.top = (window.pageYOffset || document.documentElement.scrollTop) + "px";
    textArea.setAttribute("readonly", ""); // Avoid keyboard popup on some devices

    document.body.appendChild(textArea);

    // Select the text
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
      console.log("Link copied to clipboard:", text);
      callback();
    } else {
      console.warn("Clipboard copy failed. URL:", text);
      toast.error("Could not copy the link automatically. You can find it in the browser console (F12).");
    }
  };

  const modalContent = (
    <>
      <div className={styles.dragHandle} aria-hidden="true" />
      <div className={styles.innerModal}>
        <div className={styles.header}>
          {!showSuccess && step === 1 && (
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.clearBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  if (cartItems.length > 0) {
                    setShowClearConfirm(true);
                  }
                }}
                disabled={cartItems.length === 0}
              >
                clear
              </button>
            </div>
          )}
          <h2
            onClick={step === 1 ? handleHeaderClick : undefined}
            style={step === 1 ? { cursor: "pointer", userSelect: "none" } : undefined}
          >
            {showSuccess ? "Order received" : step === 1 ? "Your cart" : "Checkout"}
          </h2>
          <div className={styles.rightActions}>
            {!showSuccess && cartItems.length > 0 && step === 1 && (
              <button
                className={styles.shareBtn}
                onClick={handleShare}
                title="Share cart"
              >
                <ShareIcon size={18} />
              </button>
            )}
            <CloseButton onClick={handleClose} isAbsolute={false} />
          </div>
        </div>

        {IS_READ_ONLY && (
          <p role="status">Read-only demo: no orders are sent. Contact entry and form storage are disabled. Do not enter personal information.</p>
        )}
        {showSuccess ? (
          <div className={styles.successMessage}>
            <div style={{ marginBottom: "1.5rem" }}>
              <SuccessCheckmark size={80} />
            </div>
            <h3>{IS_SANDBOX ? "Test order saved" : "Thank you for your order!"}</h3>
            <p>{IS_SANDBOX ? "Your test order was saved. A notification has been dispatched to Telegram. Payment and physical delivery are simulated." : "We have received your request and will contact you soon to confirm the details."}</p>
            <button
              type="button"
              className={styles.successCloseBtn}
              onClick={handleClose}
            >
              Close
            </button>
          </div>
        ) : cartItems.length === 0 ? (
          <div className={styles.empty}>Your cart is empty</div>
        ) : step === 1 ? (
          <div className={styles.body}>
            <div ref={itemsListRef} className={styles.itemsList}>
              {cartItems.map((item) => {
                const handleDelete = () => {
                  setConfirmItem({
                    id: item.id,
                    name: item.name + (item.selectedOption ? ` (${item.selectedOption.name})` : ""),
                  });
                };

                const handleItemClick = () => {
                  if (isIgnoringClick.current) return;
                  openProductModal(item);
                };

                const itemMinQty = item.selectedOption?.minOrderQuantity !== undefined && item.selectedOption?.minOrderQuantity !== null
                  ? item.selectedOption.minOrderQuantity
                  : item.minOrderQuantity;

                const itemContent = (
                  <>
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      title="Remove item"
                    >
                      ×
                    </button>
                    <Image
                      src={item.imageUrl}
                      alt={getProductAltText(item, item.selectedOption?.name)}
                      wrapperClassName={styles.imageWrapper}
                    />
                    <div className={styles.info}>
                      <div className={styles.name}>{item.name}</div>
                      {item.selectedOption && (
                        <div className={styles.optionLabel}>
                          {item.selectedOption.name}
                        </div>
                      )}
                      <div className={styles.priceRow}>
                        <span className={styles.price}>
                          {formatPrice(item.priceInfo.price)} ₽
                          {itemMinQty && (
                            <span className={styles.priceUnit}>
                              each
                            </span>
                          )}
                        </span>
                        <div
                          className={styles.quantityControls}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className={styles.qtyBtn}
                            onMouseDown={() => {
                              isAdjustingQuantity.current = true;
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const minQty = Number(itemMinQty) || 1;
                              if (item.quantity <= minQty) {
                                setQuantity(item.id, 0);
                                handleDelete();
                              } else {
                                updateQuantity(item.id, -1);
                              }
                              setTimeout(() => {
                                isAdjustingQuantity.current = false;
                              }, 50);
                            }}
                          >
                            −
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className={styles.qtyInput}
                            value={item.quantity}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              if (val === "") {
                                setQuantity(item.id, 0);
                              } else {
                                const num = parseInt(val, 10);
                                setQuantity(item.id, num > 999 ? 999 : num);
                              }
                            }}
                            onFocus={(e) => {
                              const target = e.target;
                              const len = target.value.length;
                              setTimeout(() => {
                                target.setSelectionRange(len, len);
                              }, 0);
                            }}
                            onBlur={() => {
                              isIgnoringClick.current = true;
                              setTimeout(() => {
                                isIgnoringClick.current = false;
                              }, 250);

                              if (isAdjustingQuantity.current) {
                                return;
                              }

                              const minQty = Number(itemMinQty) || 1;
                              if (item.quantity === 0) {
                                setConfirmItem({
                                  id: item.id,
                                  name: item.name,
                                });
                              } else if (item.quantity < minQty) {
                                // If a positive quantity is below the minimum order quantity,
                                // raise it to the minimum.
                                setQuantity(item.id, minQty);
                                toast(`Minimum order quantity: \n ${minQty} pcs`, {
                                  id: `min-qty-${item.id}`,
                                  duration: 1500,
                                  style: {
                                    textAlign: "center",
                                    borderRadius: "12px",
                                    background: "#333",
                                    color: "#fff",
                                    fontSize: "0.95rem",
                                  },
                                });
                              }
                            }}
                          />
                          <button
                            className={styles.qtyBtn}
                            onMouseDown={() => {
                              isAdjustingQuantity.current = true;
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.id, 1);
                              setTimeout(() => {
                                isAdjustingQuantity.current = false;
                              }, 50);
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                );

                if (!isMobile) {
                  return (
                    <div
                      key={item.id}
                      className={styles.item}
                      onClick={handleItemClick}
                      style={{ cursor: "pointer" }}
                    >
                      {itemContent}
                    </div>
                  );
                }

                return (
                  <SwipeableCartItem
                    key={item.id}
                    isOpenState={openSwipeId === item.id}
                    onOpen={() => setOpenSwipeId(item.id)}
                    onDelete={handleDelete}
                    onClick={handleItemClick}
                  >
                    {itemContent}
                  </SwipeableCartItem>
                );
              })}
            </div>

            <div className={styles.footer}>
              {IS_DELIVERY_ENABLED && (
                <div className={styles.progressSection}>
                  {/* Delivery Progress */}
                  <div
                    className={classNames(styles.progressBlock, {
                      [styles.success]: isDeliveryAvailable,
                      [styles.info]: !isDeliveryAvailable && isMinOrderReached,
                      [styles.disabled]: !isMinOrderReached,
                    })}
                  >
                    <div className={styles.progressHeader}>
                      <span className={styles.progressLabel} style={{ color: "inherit", fontSize: "0.95rem", fontWeight: 600 }}>
                        {isDeliveryAvailable ? "Free delivery" : `Delivery fee: ${formatPrice(DELIVERY_COST)} ₽`}
                      </span>
                      <span className={styles.progressStatus} style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                        {isDeliveryAvailable
                          ? "Available"
                          : `Spend this much more for free delivery: ${formatPrice(deliveryRemaining)} ₽`}
                      </span>
                    </div>
                    <div className={styles.progressBarBg}>
                      <div
                        className={styles.progressBarFill}
                        style={{ width: `${deliveryProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.totalRow}>
                <div className={styles.totalLabel}>Total:</div>
                <div className={styles.totalPrice}>
                  <AnimatedNumber value={cartFinalPrice} suffix=" ₽" />
                </div>
              </div>

              <button
                className={classNames(styles.checkoutBtn, {
                  [styles.checkoutBtnDisabled]: !isMinOrderReached,
                })}
                disabled={!isMinOrderReached}
                onClick={() => setStep(2)}
              >
                {!isMinOrderReached
                  ? `Add items worth ${formatPrice(minOrderRemaining)} ₽`
                  : "Proceed to checkout"}
              </button>
            </div>
          </div>
        ) : IS_READ_ONLY ? (
          <div className={styles.step}>
            <p>Checkout is unavailable in this demo. You can still browse, edit, and share your cart.</p>
            <button type="button" className={styles.backBtn} onClick={() => setStep(1)}>Back to cart</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.step} noValidate>
            <div className={styles.contactRow}>
              <div className={`${styles.field} ${submitAttempted && isFieldInvalid("name") ? styles.hasError : ""}`}>
                <label>
                  Your name <span className={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Alex"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                {submitAttempted && isFieldInvalid("name") && (
                  <span className={styles.errorText}>Required field</span>
                )}
              </div>

              <div className={`${styles.field} ${submitAttempted && isFieldInvalid("phone") ? styles.hasError : ""}`}>
                <label>
                  Phone <span className={styles.requiredAsterisk}>*</span>
                </label>
                <ProtectedZone>
                  <IMaskInput
                    mask="+7 (000) 000-00-00"
                    value={phone}
                    onAccept={(value: string) =>
                      setPhone(value)
                    }
                    onFocus={() => {
                      if (!phone) {
                        setPhone("+7 (");
                      }
                    }}
                    onBlur={() => {
                      if (
                        phone === "7" ||
                        phone === "+7 (" ||
                        phone === "+7"
                      ) {
                        setPhone("");
                      }
                    }}
                    required
                    type="tel"
                    placeholder="+7 (999) 999-99-99"
                  />
                </ProtectedZone>
                {submitAttempted && isFieldInvalid("phone") && (
                  <span className={styles.errorText}>
                    {phone && phone.length < 18
                      ? "Enter the full phone number"
                      : "Required field"}
                  </span>
                )}
              </div>
            </div>

            <div className={`${styles.field} ${submitAttempted && isFieldInvalid("contactMethod") ? styles.hasError : ""}`}>
              <label>
                How should we contact you? <span className={styles.requiredAsterisk}>*</span>
              </label>
              <ProtectedZone>
                <Select
                  value={contactMethod}
                  onChange={(val) => setContactMethod(val)}
                  options={[
                    "Call me",
                    "Message me on Telegram",
                    "Message me on WhatsApp",
                    "Message me on MAX",
                  ]}
                  placeholder="How should we contact you?"
                  required
                  hasError={submitAttempted && isFieldInvalid("contactMethod")}
                />
              </ProtectedZone>
              {submitAttempted && isFieldInvalid("contactMethod") && (
                <span className={styles.errorText}>Required field</span>
              )}
            </div>

            <div className={styles.contactRow}>
              <div className={styles.field}>
                <label>Number of guests</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="For example, 20"
                  value={guests}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setGuests(val);
                  }}
                />
              </div>

              <div className={`${styles.field} ${dateError || (submitAttempted && Boolean(eventDate && isDateInPast(eventDate))) ? styles.hasError : ""}`}>
                <label>Approximate event date</label>
                <ProtectedZone>
                  <DatePicker
                    value={eventDate}
                    onChange={(val) => {
                      setEventDate(val);
                      if (val) setDateError(false);
                    }}
                    placeholder="Select a date"
                    hasError={dateError || (submitAttempted && Boolean(eventDate && isDateInPast(eventDate)))}
                  />
                </ProtectedZone>
                {dateError && (
                  <span className={styles.errorText}>This field is required</span>
                )}
              </div>
            </div>

            <label className={styles.consentLabel}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
              />
              <span className={`${styles.checkboxText} ${styles.privacyPolicy}`}>
                I agree to the <a className={styles.link} target="_blank" href="/privacy-policy" rel="noopener noreferrer">privacy policy</a>
              </span>
            </label>

            {IS_SANDBOX && <p role="note">Test order - details are submitted and forwarded to Telegram. Payment and physical delivery are simulated.</p>}
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={!consent || isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Place order"}
              </button>
            </div>
          </form>
        )}

        <ConfirmationModal
          isOpen={!!confirmItem}
          title="Remove this item from your cart?"
          confirmText="Remove"
          cancelText="Keep"
          onConfirm={() => {
            if (confirmItem) {
              removeFromCart(confirmItem.id);
              setConfirmItem(null);
            }
          }}
          onCancel={() => {
            confirmItem?.onKeep?.();
            setConfirmItem(null);
          }}
        />

        <ConfirmationModal
          isOpen={showClearConfirm}
          title="Clear your entire cart?"
          confirmText="Clear"
          cancelText="Cancel"
          onConfirm={() => {
            clearCart();
            setShowClearConfirm(false);
          }}
          onCancel={() => setShowClearConfirm(false)}
        />
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={(open) => !open && handleClose()} repositionInputs={false}>
        <Drawer.Portal>
          <Drawer.Overlay className={styles.overlay} />
          <Drawer.Content className={styles.modal} aria-describedby={undefined}>
            <Drawer.Title
              style={{
                position: "absolute",
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: "hidden",
                clip: "rect(0, 0, 0, 0)",
                whiteSpace: "nowrap",
                borderWidth: 0,
              }}
            >
              Cart
            </Drawer.Title>
            {modalContent}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {modalContent}
      </div>
    </div>
  );
};
