import { useEffect, useState } from "react";

/**
 * Animate a number from its current value to the target.
 * @param targetValue Target value.
 * @param duration Animation duration in milliseconds.
 */
export const useAnimatedNumber = (
  targetValue: number,
  duration: number = 400,
) => {
  const [displayValue, setDisplayValue] = useState(targetValue);

  useEffect(() => {
    let startTime: number | null = null;
    const startValue = displayValue;

    if (startValue === targetValue) return;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function: easeOutExpo
      const easeOutProgress =
        progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const currentValue = Math.floor(
        startValue + (targetValue - startValue) * easeOutProgress,
      );

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [targetValue, duration]);

  return displayValue;
};
