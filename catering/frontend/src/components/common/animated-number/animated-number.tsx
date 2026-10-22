"use client";

import React, { useState, useEffect } from "react";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { formatPrice } from "@/utils/formatPrice";
import classNames from "classnames";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  suffix?: string;
  duration?: number;
  showBump?: boolean;
}

export const AnimatedNumber = ({
  value,
  className,
  suffix = "",
  duration = 400,
  showBump = true,
}: AnimatedNumberProps) => {
  const animatedValue = useAnimatedNumber(value, duration);
  const [isBump, setIsBump] = useState(false);

  const prevValue = React.useRef(value);

  useEffect(() => {
    const isChanging = value !== prevValue.current;
    const canBump =
      showBump && value > 0 && prevValue.current > 0 && isChanging;

    prevValue.current = value;

    if (canBump) {
      setIsBump(true);
      const timer = setTimeout(() => setIsBump(false), 200);
      return () => clearTimeout(timer);
    }
  }, [value, showBump]);

  return (
    <span
      className={classNames("price-transition", className, {
        "bump-animation": isBump,
      })}
    >
      {formatPrice(animatedValue)}
      {suffix}
    </span>
  );
};
