"use client";

import { useRef, type KeyboardEvent, type ClipboardEvent } from "react";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
};

export function OtpInput({ value, onChange, length = 6, disabled = false }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const setDigit = (index: number, char: string) => {
    if (!/^\d?$/.test(char)) return;
    const digits = value.split("");
    digits[index] = char;
    onChange(digits.join("").slice(0, length));
    if (char && index < length - 1) refs.current[index + 1]?.focus();
  };

  const onKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const digits = value.split("");
      if (!digits[index] && index > 0) {
        digits[index - 1] = "";
        onChange(digits.join(""));
        refs.current[index - 1]?.focus();
      } else {
        digits[index] = "";
        onChange(digits.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    // Tighter gap on phones (gap-1.5) guarantees it fits on 320px screens (iPhone SE).
    // Boxes are 44px wide (w-11) which is the Apple/Google minimum touch target size.
    <div className="flex justify-center gap-1.5 sm:gap-2.5">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={value[i] || ""}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          autoFocus={i === 0}
          aria-label={`Digit ${i + 1}`}
          className="h-12 w-11 sm:h-14 sm:w-12 text-center text-xl font-semibold text-slate-900
            bg-white border border-slate-300 rounded-xl
            focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 focus:outline-none
            transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      ))}
    </div>
  );
}