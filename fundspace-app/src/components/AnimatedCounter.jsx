// src/components/AnimatedCounter.jsx
import React, { useState, useEffect } from 'react';

const AnimatedCounter = ({ targetValue, duration = 2000, step = 1, prefix = '', suffix = '', formatValue, className = '' }) => {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    let startValue = 0;
    const incrementTime = 15;
    const totalIncrements = Math.ceil(duration / incrementTime);
    const calculatedStep = Math.max(step, Math.ceil(targetValue / totalIncrements));

    let animationFrameId;
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);

      let newValue = startValue + (targetValue - startValue) * percentage;
      newValue = Math.round(newValue / step) * step;

      setCurrentValue(Math.min(newValue, targetValue));

      if (progress < duration) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCurrentValue(targetValue);
      }
    };

    if (targetValue > 0) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      setCurrentValue(0);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [targetValue, duration, step]);

  const formattedValue = formatValue ? formatValue(currentValue) : currentValue.toLocaleString();

  // FIX: Changed from <p> to <span> and use a flexible className prop
  return (
    <span className={className}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
};

export default AnimatedCounter;