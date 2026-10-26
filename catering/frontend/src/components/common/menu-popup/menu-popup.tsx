"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./menu-popup.module.scss";
import { useAppState, useAppActions } from "@/context/app-context";
import { CloseButton } from "@/components/common/close-button/close-button";
import { Drawer } from "vaul";
import { useMobile } from "@/hooks/useMobile";
import { ConfirmationModal } from "@/components/common/confirmation-modal/confirmation-modal";
import { IMaskInput } from "react-imask";
import { Select } from "@/components/common/select/select";
import { DatePicker } from "@/components/common/date-picker/date-picker";
import { SuccessCheckmark } from "@/components/common/success-checkmark/success-checkmark";
import { toast } from "react-hot-toast";
import {
  useCreateMenuRequestMutation,
  useGetEventFormatsQuery,
  useGetAdditionalServicesQuery,
  useGetCalculateSettingsQuery
} from "@/store/services/menuRequestsApi";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { ProtectedZone } from "@/components/common/error-boundary/ProtectedZone";
import { isDateInPast } from "@/utils/date";

const FORM_DATA_STORAGE_KEY = "menu-popup-form-data";
const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';
const IS_SANDBOX = process.env.NEXT_PUBLIC_PORTFOLIO_ORDERING_ENABLED === 'true';
const IS_READ_ONLY = IS_DEMO_MODE && !IS_SANDBOX;
const STORAGE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours (one day).

const DEFAULT_FOOD_OPTIONS = [
  "Appetizers",
  "Hot dishes",
  "Salads",
  "Desserts",
];

const CUSTOM_BUDGET_OPTION = "Enter a custom amount";

const DEFAULT_BUDGET_OPTIONS = [
  "Not sure - please advise",
  "Under 15,000 ₽",
  "15 000 - 30 000 ₽",
  "30 000 - 50 000 ₽",
  "50 000 - 100 000 ₽",
  "Over 100,000 ₽",
];

export interface MenuFormData {
  format: string;
  guests: string;
  budget: string;
  date: string;
  additional: string[];
  name: string;
  phone: string;
  contact_method: string;
  consent: boolean;
}

export interface MenuPopupProps {
  onSubmit?: (data: MenuFormData) => void;
  isEmbedded?: boolean;
  budgetOptions?: string[];
  foodOptions?: string[];
}

const formTemplateData: MenuFormData = {
  format: "",
  guests: "",
  budget: "",
  date: "",
  additional: [],
  name: "",
  phone: "",
  contact_method: "Call me",
  consent: true,
};

export const MenuPopup = ({
  onSubmit,
  isEmbedded = false,
  budgetOptions: customBudgetOptions,
  foodOptions: customFoodOptions,
}: MenuPopupProps) => {
  const { data: calculateSettings } = useGetCalculateSettingsQuery();
  const baseBudgetOptions =
    customBudgetOptions ||
    calculateSettings?.budget_options?.map((b: any) => (typeof b === "string" ? b : b.name)) ||
    DEFAULT_BUDGET_OPTIONS;

  const budgetOptions = React.useMemo(() => {
    const list = baseBudgetOptions.filter((opt: string) => opt !== CUSTOM_BUDGET_OPTION);
    return [...list, CUSTOM_BUDGET_OPTION];
  }, [baseBudgetOptions]);

  const foodOptions =
    customFoodOptions ||
    calculateSettings?.food_options?.map((f: any) => (typeof f === "string" ? f : f.name)) ||
    DEFAULT_FOOD_OPTIONS;

  const { isMenuPopupOpen, selectedProduct } = useAppState();
  const { setMenuPopupOpen, openProductModal } = useAppActions();
  const isMobile = useMobile();

  const [step, setStep] = useState(1);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [step2Attempted, setStep2Attempted] = useState(false);
  const [dateError, setDateError] = useState(false);

  const [formData, setFormData] = useState<MenuFormData>(() => {
    if (IS_DEMO_MODE || IS_SANDBOX) return { ...formTemplateData };
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(FORM_DATA_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const isTimestamped =
            parsed &&
            typeof parsed === "object" &&
            "timestamp" in parsed &&
            "data" in parsed;
          const timestamp = isTimestamped ? parsed.timestamp : null;
          const data = (isTimestamped ? parsed.data : parsed) as Partial<MenuFormData>;

          // Clear saved data older than 24 hours and use defaults.
          if (timestamp && Date.now() - timestamp > STORAGE_TTL_MS) {
            localStorage.removeItem(FORM_DATA_STORAGE_KEY);
            return { ...formTemplateData };
          }

          if (data && typeof data === "object") {
            if (data.date === "null" || data.date === "undefined") {
              data.date = "";
            }
            // Clear the saved event date if it is in the past.
            if (data.date && isDateInPast(data.date)) {
              data.date = "";
            }
            return { ...formTemplateData, ...data };
          }
        } catch (e) {
          console.error("Failed to parse saved form data:", e);
        }
      }
    }
    return { ...formTemplateData };
  });

  const [isCustomBudget, setIsCustomBudget] = useState(false);
  const customBudgetInputRef = useRef<HTMLInputElement>(null);
  const formatFieldRef = useRef<HTMLDivElement>(null);
  const guestsFieldRef = useRef<HTMLDivElement>(null);
  const dateFieldRef = useRef<HTMLDivElement>(null);
  const nameFieldRef = useRef<HTMLDivElement>(null);
  const phoneFieldRef = useRef<HTMLDivElement>(null);
  const contactMethodFieldRef = useRef<HTMLDivElement>(null);
  const consentRef = useRef<HTMLLabelElement>(null);

  const scrollToField = (
    elementOrRef: HTMLElement | React.RefObject<HTMLElement | null> | null
  ) => {
    setTimeout(() => {
      const element =
        elementOrRef && "current" in elementOrRef
          ? elementOrRef.current
          : (elementOrRef as HTMLElement | null);
      if (!element) return;
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  useEffect(() => {
    if (formData.budget && !baseBudgetOptions.includes(formData.budget) && formData.budget !== CUSTOM_BUDGET_OPTION) {
      setIsCustomBudget(true);
    }
  }, [baseBudgetOptions, formData.budget]);

  const handleBudgetChange = (val: string) => {
    if (val === CUSTOM_BUDGET_OPTION) {
      setIsCustomBudget(true);
      setFormData((prev) => ({ ...prev, budget: "" }));
      setTimeout(() => {
        customBudgetInputRef.current?.focus();
      }, 50);
    } else {
      setIsCustomBudget(false);
      setFormData((prev) => ({ ...prev, budget: val }));
    }
  };

  const isFieldInvalid = (field: keyof MenuFormData) => {
    if (field === "format") return !formData.format;
    if (field === "guests") return !formData.guests;
    if (field === "name") return !formData.name.trim();
    if (field === "phone") {
      return !formData.phone || formData.phone.length < 18;
    }
    if (field === "contact_method") return !formData.contact_method;
    return false;
  };

  const { data: apiFormats } = useGetEventFormatsQuery();
  const { data: apiServices } = useGetAdditionalServicesQuery();
  const [createMenuRequest, { isLoading: isSubmitting }] = useCreateMenuRequestMutation();

  const formats = apiFormats?.map(f => f.name) || [];
  const additionalOptions = apiServices || [];

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const checkboxGroupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (IS_DEMO_MODE || IS_SANDBOX) {
        try {
          localStorage.removeItem(FORM_DATA_STORAGE_KEY);
        } catch {
          // Storage may be unavailable; demo must still never read or write it.
        }
        return;
      }
      localStorage.setItem(
        FORM_DATA_STORAGE_KEY,
        JSON.stringify({
          data: formData,
          timestamp: Date.now(),
        })
      );
    }
  }, [formData]);

  const handleClose = () => {
    if (selectedProduct) return;
    if (step === 3) {
      setFormData({ ...formTemplateData });
      setSubmitAttempted(false);
      setStep2Attempted(false);
      setDateError(false);
      setStep(1);
      setIsCustomBudget(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem(FORM_DATA_STORAGE_KEY);
      }
    }
    if (!isEmbedded) {
      setMenuPopupOpen(false);
    }
  };

  const handleViewMenuClick = (e: React.MouseEvent) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(FORM_DATA_STORAGE_KEY);
      if (window.location.pathname === "/") {
        e.preventDefault();
        const catalogEl = document.getElementById("catalog");
        if (catalogEl) {
          const headerOffset = window.innerWidth <= 768 ? 70 : 85;
          const elementPosition = catalogEl.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
      }
    }
    if (!isEmbedded) {
      handleClose();
    } else {
      setFormData({ ...formTemplateData });
      setStep(1);
      setIsCustomBudget(false);
      setSubmitAttempted(false);
      setStep2Attempted(false);
      setDateError(false);
    }
  };

  useEscapeKey(handleClose, isMenuPopupOpen && !isEmbedded && !selectedProduct);

  if (!isEmbedded && !isMenuPopupOpen && !isMobile) return null;

  const handleCheckbox = (option: string) => {
    setFormData((prev) => {
      const isSelected = prev.additional.includes(option);
      return {
        ...prev,
        additional: isSelected
          ? prev.additional.filter((item) => item !== option)
          : [...prev.additional, option],
      };
    });
  };

  const handleStep1Next = () => {
    setSubmitAttempted(true);
    const isFormatInvalid = isFieldInvalid("format");
    const isGuestsInvalid = isFieldInvalid("guests");
    const isDatePast = isDateInPast(formData.date);
    const isDateMissingAfterError = dateError && !formData.date;
    const hasErrors = isFormatInvalid || isGuestsInvalid || isDatePast || isDateMissingAfterError;

    if (hasErrors) {
      if (isDatePast) {
        setFormData((prev) => ({ ...prev, date: "" }));
        setDateError(true);
        toast.error("The date cannot be in the past", {
          id: "date-past-error",
        });
        scrollToField(dateFieldRef);
        return;
      }

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

      const target = isFormatInvalid
        ? formatFieldRef
        : isGuestsInvalid
          ? guestsFieldRef
          : dateFieldRef;
      scrollToField(target);
    } else {
      setStep(2);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (step === 1) {
      handleStep1Next();
      return;
    }
    if (IS_READ_ONLY) {
      toast.error("Read-only demo: requests and contact collection are disabled.");
      return;
    }
    setStep2Attempted(true);

    if (isDateInPast(formData.date)) {
      setStep(1);
      setSubmitAttempted(true);
      setDateError(true);
      setFormData((prev) => ({ ...prev, date: "" }));
      toast.error("The date cannot be in the past", {
        id: "date-past-error",
      });
      scrollToField(dateFieldRef);
      return;
    }

    if (dateError && !formData.date) {
      setStep(1);
      setSubmitAttempted(true);
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
      scrollToField(dateFieldRef);
      return;
    }

    const isNameInvalid = isFieldInvalid("name");
    const isPhoneInvalid = isFieldInvalid("phone");
    const isContactMethodInvalid = isFieldInvalid("contact_method");
    const isConsentInvalid = !formData.consent;
    const hasErrors =
      isNameInvalid ||
      isPhoneInvalid ||
      isContactMethodInvalid ||
      isConsentInvalid;

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
      const target = isNameInvalid
        ? nameFieldRef
        : isPhoneInvalid
          ? phoneFieldRef
          : isContactMethodInvalid
            ? contactMethodFieldRef
            : consentRef;
      scrollToField(target);
      return;
    }

    try {
      const submitData = {
        ...formData,
        date: (formData.date && formData.date !== "null" && formData.date !== "undefined") ? formData.date : null,
      };
      await createMenuRequest(submitData).unwrap();
      if (onSubmit) {
        onSubmit(formData);
      }
      setSubmitAttempted(false);
      setStep2Attempted(false);
      setDateError(false);
      setStep(3);
      if (IS_SANDBOX) setFormData({ ...formTemplateData });
      if (typeof window !== "undefined") {
        localStorage.removeItem(FORM_DATA_STORAGE_KEY);
      }
      if (isEmbedded && typeof window !== "undefined") {
        const formEl = document.getElementById("calculate-form");
        if (formEl) {
          formEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    } catch (error: any) {
      const dateErrorMsg =
        error?.data?.date?.[0] ||
        (typeof error?.data?.date === "string" ? error?.data?.date : null);
      if (dateErrorMsg || error?.data?.detail?.includes("\u043f\u0440\u043e\u0448\u043b\u043e\u043c")) {
        setStep(1);
        setSubmitAttempted(true);
        setDateError(true);
        setFormData((prev) => ({ ...prev, date: "" }));
        toast.error("The date cannot be in the past", {
          id: "date-past-error",
        });
        scrollToField(dateFieldRef);
      } else {
        toast.error("Could not send your request. Please try again.");
      }
    }
  };

  const content = (
    <div className={styles.innerModal}>
      {IS_READ_ONLY && (
        <p role="status">Read-only demo: no requests are sent. Contact entry and form storage are disabled. Do not enter personal information.</p>
      )}
      {!isEmbedded && <div className={styles.dragHandle} aria-hidden="true" />}

      {isEmbedded ? (
        step !== 3 && (
          <div className={styles.embeddedHeader}>
            <h2 className={styles.title}>Event details</h2>
            <button
              className={styles.clearBtnEmbedded}
              onClick={() => setShowClearConfirm(true)}
              type="button"
            >
              clear form
            </button>
          </div>
        )
      ) : isMobile ? (
        <div className={styles.header}>
          {step !== 3 && (
            <button
              className={styles.clearBtn}
              onClick={(e) => {
                e.stopPropagation();
                setShowClearConfirm(true);
              }}
              type="button"
            >
              clear
            </button>
          )}
          {step !== 3 && <h2 className={styles.title}>Get a menu estimate</h2>}
          <CloseButton onClick={handleClose} />
        </div>
      ) : (
        <>
          <CloseButton onClick={handleClose} />
          {step !== 3 && (
            <>
              <button
                className={styles.clearBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowClearConfirm(true);
                }}
                type="button"
              >
                clear
              </button>
              <div className={styles.header}>
                <h2 className={styles.title}>Get a menu estimate</h2>
                <p className={styles.subtitle}>
                  {step === 1
                    ? "Get a free estimate in 15 minutes"
                    : "Where should we send your menu and estimate options?"}
                </p>
              </div>
            </>
          )}
          {step !== 3 && (
            <div className={styles.progress}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: step === 1 ? "50%" : "100%" }}
                />
              </div>
              <span className={styles.progressText}>Step {step} of 2</span>
            </div>
          )}
        </>
      )}

      {isEmbedded && step !== 3 && (
        <>
          <p className={styles.subtitle}>
            {step === 1
              ? "Get a free estimate in 15 minutes"
              : "Where should we send your menu and estimate options?"}
          </p>
          <div className={styles.progress}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: step === 1 ? "50%" : "100%" }}
              />
            </div>
            <span className={styles.progressText}>Step {step} of 2</span>
          </div>
        </>
      )}

      <ConfirmationModal
        isOpen={showClearConfirm}
        title="Clear the form?"
        confirmText="Clear"
        cancelText="Cancel"
        onConfirm={() => {
          setFormData({ ...formTemplateData });
          setSubmitAttempted(false);
          setStep2Attempted(false);
          setDateError(false);
          setStep(1);
          setIsCustomBudget(false);
          setShowClearConfirm(false);
          if (typeof window !== "undefined") {
            localStorage.removeItem(FORM_DATA_STORAGE_KEY);
          }
        }}
        onCancel={() => setShowClearConfirm(false)}
      />

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        {isMobile && !isEmbedded && step !== 3 && (
          <>
            <p className={styles.subtitle}>
              {step === 1
                ? "Get a free estimate in 15 minutes"
                : "Where should we send your menu and estimate options?"}
            </p>

            <div className={styles.progress}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: step === 1 ? "50%" : "100%" }}
                />
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <div className={styles.step}>
            <div className={styles.row}>
              <div
                ref={formatFieldRef}
                className={`${styles.field} ${submitAttempted && isFieldInvalid("format") ? styles.hasError : ""}`}
              >
                <label>
                  Event type <span className={styles.requiredAsterisk}>*</span>
                </label>
                <ProtectedZone>
                  <Select
                    value={formData.format}
                    onChange={(val) => setFormData({ ...formData, format: val })}
                    options={formats}
                    placeholder="Select an event type"
                    required
                    hasError={submitAttempted && isFieldInvalid("format")}
                  />
                </ProtectedZone>
                {submitAttempted && isFieldInvalid("format") && (
                  <span className={styles.errorText}>Required field</span>
                )}
              </div>

              <div
                ref={guestsFieldRef}
                className={`${styles.field} ${submitAttempted && isFieldInvalid("guests") ? styles.hasError : ""}`}
              >
                <label>
                  Number of guests <span className={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="For example, 20"
                  value={formData.guests}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setFormData({ ...formData, guests: val });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleStep1Next();
                    }
                  }}
                  required
                />
                {submitAttempted && isFieldInvalid("guests") && (
                  <span className={styles.errorText}>Required field</span>
                )}
              </div>
            </div>

            <div className={styles.row}>
              <div
                ref={dateFieldRef}
                className={`${styles.field} ${dateError || (submitAttempted && isDateInPast(formData.date)) ? styles.hasError : ""}`}
              >
                <label>
                  Approximate event date
                </label>
                <ProtectedZone>
                  <DatePicker
                    value={formData.date}
                    onChange={(val) => {
                      setFormData({ ...formData, date: val });
                      if (val) {
                        setDateError(false);
                      }
                    }}
                    hasError={dateError || (submitAttempted && isDateInPast(formData.date))}
                  />
                </ProtectedZone>
                {dateError && (
                  <span className={styles.errorText}>This field is required</span>
                )}
              </div>

              <div className={styles.field}>
                <label>Estimated budget</label>
                <ProtectedZone>
                  {isCustomBudget ? (
                    <div className={styles.customBudgetWrapper}>
                      {(() => {
                        const customBudgetDisplay = formData.budget
                          ? formData.budget.replace(/[^\d\s]/g, "").trim()
                          : "";
                        return (
                          <>
                            <input
                              ref={customBudgetInputRef}
                              type="text"
                              inputMode="numeric"
                              placeholder="For example, 50,000"
                              value={customBudgetDisplay}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, "");
                                if (!raw) {
                                  setFormData((prev) => ({ ...prev, budget: "" }));
                                  return;
                                }
                                if (raw.length > 10) return;
                                const formatted = Number(raw).toLocaleString("en-US");
                                setFormData((prev) => ({ ...prev, budget: `${formatted} ₽` }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Backspace") {
                                  const input = e.currentTarget;
                                  const { selectionStart, selectionEnd } = input;
                                  if (
                                    selectionStart === selectionEnd &&
                                    selectionStart !== null &&
                                    selectionStart > 1
                                  ) {
                                    const charBefore = input.value[selectionStart - 1];
                                    if (charBefore === " " || charBefore === "\u00A0") {
                                      e.preventDefault();
                                      const raw = (
                                        input.value.slice(0, selectionStart - 2) +
                                        input.value.slice(selectionStart)
                                      ).replace(/\D/g, "");
                                      const formatted = raw ? Number(raw).toLocaleString("en-US") : "";
                                      setFormData((prev) => ({
                                        ...prev,
                                        budget: formatted ? `${formatted} ₽` : "",
                                      }));
                                    }
                                  }
                                }
                              }}
                              autoFocus
                            />
                            {customBudgetDisplay && (
                              <span className={styles.currencySuffix}>₽</span>
                            )}
                          </>
                        );
                      })()}
                      <button
                        type="button"
                        className={styles.resetBudgetBtn}
                        onClick={() => {
                          setIsCustomBudget(false);
                          setFormData({ ...formData, budget: "" });
                        }}
                        title="Choose from the list"
                        aria-label="Return to the list of options"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <Select
                      value={formData.budget}
                      onChange={handleBudgetChange}
                      options={budgetOptions}
                      placeholder="Select a budget"
                    />
                  )}
                </ProtectedZone>
              </div>
            </div>

            <div className={styles.field}>
              <label>Food preferences</label>
              <div className={`${styles.checkboxGroup} ${styles.wrap}`}>
                {foodOptions.map((opt: string) => (
                  <label key={opt} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.additional.includes(opt)}
                      onChange={() => handleCheckbox(opt)}
                    />
                    <span className={styles.checkboxText}>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="button"
              className={styles.nextBtn}
              onClick={handleStep1Next}
            >
              Next
            </button>
          </div>
        )}

        {step === 2 && IS_READ_ONLY && (
          <div className={styles.step}>
            <p>Contact collection and estimate requests are unavailable in this demo.</p>
            <button type="button" className={styles.backBtn} onClick={() => setStep(1)}>Back to event details</button>
          </div>
        )}
        {step === 2 && !IS_READ_ONLY && (
          <div className={styles.step}>
            <div className={styles.contactRow}>
              <div
                ref={nameFieldRef}
                className={`${styles.field} ${step2Attempted && isFieldInvalid("name") ? styles.hasError : ""}`}
              >
                <label>
                  Your name <span className={styles.requiredAsterisk}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Alex"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                {step2Attempted && isFieldInvalid("name") && (
                  <span className={styles.errorText}>Required field</span>
                )}
              </div>

              <div
                ref={phoneFieldRef}
                className={`${styles.field} ${step2Attempted && isFieldInvalid("phone") ? styles.hasError : ""}`}
              >
                <label>
                  Phone <span className={styles.requiredAsterisk}>*</span>
                </label>
                <ProtectedZone>
                  <IMaskInput
                    mask="+7 (000) 000-00-00"
                    value={formData.phone}
                    onAccept={(value: string) =>
                      setFormData({ ...formData, phone: value })
                    }
                    onFocus={() => {
                      if (!formData.phone) {
                        setFormData((prev) => ({ ...prev, phone: "+7 (" }));
                      }
                    }}
                    onBlur={() => {
                      if (
                        formData.phone === "7" ||
                        formData.phone === "+7 (" ||
                        formData.phone === "+7"
                      ) {
                        setFormData((prev) => ({ ...prev, phone: "" }));
                      }
                    }}
                    required
                    type="tel"
                    placeholder="+7 (999) 999-99-99"
                  />
                </ProtectedZone>
                {step2Attempted && isFieldInvalid("phone") && (
                  <span className={styles.errorText}>
                    {formData.phone && formData.phone.length < 18
                      ? "Enter the full phone number"
                      : "Required field"}
                  </span>
                )}
              </div>
            </div>

            <div
              ref={contactMethodFieldRef}
              className={`${styles.field} ${step2Attempted && isFieldInvalid("contact_method") ? styles.hasError : ""}`}
            >
              <label>
                How should we contact you? <span className={styles.requiredAsterisk}>*</span>
              </label>
              <ProtectedZone>
                <Select
                  value={formData.contact_method}
                  onChange={(val) => setFormData({ ...formData, contact_method: val })}
                  options={[
                    "Call me",
                    "Message me on Telegram",
                    "Message me on WhatsApp",
                    "Message me on MAX",
                  ]}
                  placeholder="How should we contact you?"
                  required
                  hasError={step2Attempted && isFieldInvalid("contact_method")}
                />
              </ProtectedZone>
              {step2Attempted && isFieldInvalid("contact_method") && (
                <span className={styles.errorText}>Required field</span>
              )}
            </div>

            <div className={styles.field}>
              <label>Additional services</label>
              <div className={styles.servicesContainer}>
                <div
                  ref={checkboxGroupRef}
                  className={`${styles.checkboxGroup} ${additionalOptions.length > 4 && !showAllServices ? styles.collapsed : ""}`}
                  style={
                    showAllServices && checkboxGroupRef.current
                      ? { maxHeight: `${checkboxGroupRef.current.scrollHeight}px` }
                      : undefined
                  }
                >
                  {additionalOptions.map((opt) => (
                    <div key={opt.id} className={styles.checkboxRow}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.additional.includes(opt.id)}
                          onChange={() => handleCheckbox(opt.id)}
                        />
                        <span className={styles.checkboxText}>{opt.label}</span>
                      </label>
                      <button
                        type="button"
                        className={styles.learnMoreBtn}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (opt.linked_product) {
                            openProductModal(opt.linked_product, { showAddButton: false, skipUrlUpdate: true });
                          } else {
                            openProductModal({
                              id: opt.id,
                              name: opt.label,
                              categoryId: opt.id,
                              extraInfo: [],
                              priceInfo: { price: 0 },
                              imageUrl: "",
                              description: opt.description || "More information about " + opt.label
                            }, { showAddButton: false, skipUrlUpdate: true });
                          }
                        }}
                      >
                        learn more
                      </button>
                    </div>
                  ))}
                  {additionalOptions.length > 4 && (
                    <div className={`${styles.gradientOverlay} ${showAllServices ? styles.hidden : ""}`}>
                      <button
                        type="button"
                        className={styles.showMoreBtn}
                        onClick={() => setShowAllServices(true)}
                      >
                        Show more
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <label
              ref={consentRef}
              className={`${styles.consentLabel} ${step2Attempted && !formData.consent ? styles.hasError : ""}`}
            >
              <input
                type="checkbox"
                checked={formData.consent}
                onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                required
              />
              <span className={`${styles.checkboxText} ${styles.privacyPolicy}`}> I agree to the <a className={styles.link} target="_blank" href="/privacy-policy">privacy policy</a> </span>
            </label>
            {step2Attempted && !formData.consent && (
              <span className={styles.errorText}>Required field</span>
            )}

            {IS_SANDBOX && <p role="note">Test estimate - details are submitted and forwarded to Telegram.</p>}
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
                disabled={!formData.consent || isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Get a free estimate"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.successMessage}>
            <div style={{ marginBottom: "1.5rem" }}>
              <SuccessCheckmark size={72} />
            </div>
            <h3>{IS_SANDBOX ? "Test estimate saved" : "Thank you for your request!"}</h3>
            <p>
              {IS_SANDBOX ? "Your test estimate was saved. A notification has been dispatched to Telegram." : "We are putting together menu options for your event. We will contact you soon with your menu."}
            </p>
            <Link
              href="/#catalog"
              className={styles.nextBtn}
              onClick={handleViewMenuClick}
            >
              Browse the menu
            </Link>
          </div>
        )
        }
      </form >
    </div >
  );

  if (isEmbedded) {
    return (
      <div className={styles.embeddedContainer}>
        {content}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Drawer.Root open={isMenuPopupOpen} onOpenChange={(open) => !open && handleClose()} repositionInputs={false}>
        <Drawer.Portal>
          <Drawer.Overlay className={styles.overlay} />
          <Drawer.Content className={styles.modal} aria-describedby={undefined}>
            <Drawer.Title style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", borderWidth: 0 }}>
              Get a menu estimate
            </Drawer.Title>
            {content}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget && !selectedProduct) {
          handleClose();
        }
      }}
      aria-modal="true"
      role="dialog"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {content}
      </div>
    </div>
  );
};
