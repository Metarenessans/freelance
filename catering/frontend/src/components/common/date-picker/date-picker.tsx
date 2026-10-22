"use client";

import React, { useState } from "react";
import { Popover, PopoverButton, PopoverPanel, Portal } from "@headlessui/react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { enUS } from "date-fns/locale";
import styles from "./date-picker.module.scss";

interface DatePickerProps {
  value: string; // ISO format YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
  required?: boolean;
  hasError?: boolean;
}

export const DatePicker = ({
  value,
  onChange,
  placeholder = "Select a date",
  required,
  hasError,
}: DatePickerProps) => {
  const selectedDate = (value && value !== "null" && value !== "undefined") ? parseISO(value) : null;
  const isValidDate = selectedDate && !isNaN(selectedDate.getTime());
  const [viewDate, setViewDate] = useState(isValidDate ? selectedDate : new Date());

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 }),
  });

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(addMonths(viewDate, 1));
  };
  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(subMonths(viewDate, 1));
  };

  return (
    <Popover className={styles.container}>
      {({ open }) => (
        <>
          <PopoverButton
            className={`${styles.trigger} ${open ? styles.open : ""} ${!value ? styles.placeholder : ""} ${hasError ? styles.hasError : ""}`}
          >
            <span>{isValidDate ? format(selectedDate, "d MMMM yyyy", { locale: enUS }) : placeholder}</span>
            <div className={styles.icon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
          </PopoverButton>

          <Portal>
            <PopoverPanel
              static
              anchor="bottom start"
              className={`${styles.panel} ${open ? styles.visible : styles.hidden}`}
            >
              {({ close }) => (
                <div className={styles.calendar}>
                  <div className={styles.header}>
                    <button type="button" onClick={prevMonth} aria-label="Previous month" className={styles.navBtn}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                    <span className={styles.monthName}>{format(viewDate, "LLLL yyyy", { locale: enUS })}</span>
                    <button type="button" onClick={nextMonth} aria-label="Next month" className={styles.navBtn}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                  <div className={styles.weekDays}>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>
                  <div className={styles.daysGrid}>
                    {days.map((day, i) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const checkDay = new Date(day);
                      checkDay.setHours(0, 0, 0, 0);
                      const isDisabled = checkDay.getTime() <= today.getTime();

                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            if (isDisabled) return;
                            onChange(format(day, "yyyy-MM-dd"));
                            close();
                          }}
                          className={`${styles.day} ${!isSameMonth(day, viewDate) ? styles.notCurrentMonth : ""} ${
                            isValidDate && isSameDay(day, selectedDate) ? styles.selected : ""
                          } ${isSameDay(day, new Date()) ? styles.today : ""}`}
                        >
                          {format(day, "d")}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </PopoverPanel>
          </Portal>
          <input type="hidden" value={value} required={required} />
        </>
      )}
    </Popover>
  );
};
