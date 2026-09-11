import React, { useEffect, useRef } from 'react';

interface ProgressRingProps {
  value: number; // 0 - 100
  size?: number;
  thickness?: number;
  fillColor?: string;
  trackColor?: string;
  ariaLabel?: string;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 76,
  thickness = 7,
  fillColor = '#2563eb',
  trackColor = '#f1f5f9',
  ariaLabel = 'Progress indicator',
  children,
}) => {
  const progressRef = useRef<HTMLProgressElement>(null);
  const clampedValue = Math.min(100, Math.max(0, Math.round(value)));

  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.setProperty('--ring-value', `${clampedValue}`);
      progressRef.current.style.setProperty('--size', `${size}px`);
      progressRef.current.style.setProperty('--thickness', `${thickness}px`);
      progressRef.current.style.setProperty('--fill-color', fillColor);
      progressRef.current.style.setProperty('--track-color', trackColor);
    }
  }, [clampedValue, size, thickness, fillColor, trackColor]);

  return (
    <div
      className="progress-ring-wrapper inline-grid place-items-center relative"
      style={{ width: size, height: size }}
    >
      <progress
        ref={progressRef}
        value={clampedValue}
        max={100}
        aria-label={ariaLabel}
        className="progress-ring"
        style={
          {
            '--ring-value': clampedValue,
            '--size': `${size}px`,
            '--thickness': `${thickness}px`,
            '--fill-color': fillColor,
            '--track-color': trackColor,
          } as React.CSSProperties
        }
      />
      {children && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
};
