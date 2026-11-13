"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  /** Estado válido: ring verde (ex.: slug disponível). */
  valid?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  pill?: boolean;
  /** `lg` = 52px (formulários), `md` = 46px (cards compactos e painéis). */
  inputSize?: "md" | "lg";
  containerClassName?: string;
}

export const fieldBaseClasses =
  "w-full bg-white text-slate-900 border border-[#f8fafc] outline-none transition-[border-color] duration-150 ease-out placeholder:text-slate-400 focus:border-[#f8fafc] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed";

export const fieldLabelClasses = "text-[13px] font-semibold text-slate-900";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      label,
      error,
      helperText,
      valid = false,
      leftIcon,
      rightIcon,
      pill = true,
      inputSize = "lg",
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const radiusClass = pill ? "rounded-full" : "rounded-2xl";

    return (
      <div className={cn("flex flex-col gap-1.5 w-full", containerClassName)}>
        {label && (
          <label htmlFor={inputId} className={fieldLabelClasses}>
            {label}
          </label>
        )}

        <div className={cn("relative flex items-center lapa-aurora-glow", radiusClass)}>
          {leftIcon && (
            <span className="absolute left-5 text-slate-500 pointer-events-none inline-flex items-center">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              fieldBaseClasses,
              "px-5.5",
              radiusClass,
              inputSize === "lg" ? "h-13 text-[15px]" : "h-11.5 text-sm",
              Boolean(leftIcon) && "pl-13",
              Boolean(rightIcon) && "pr-13",
              valid && !error && "border-whatsapp focus:border-whatsapp",
              Boolean(error) && "border-offer focus:border-offer",
              className
            )}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-5 text-slate-500 inline-flex items-center">
              {rightIcon}
            </span>
          )}
        </div>

        {error ? (
          <p
            id={errorId}
            role="alert"
            className="text-xs font-medium text-rose-600"
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            id={helperId}
            className={cn(
              "text-xs",
              valid ? "font-medium text-emerald-700" : "text-slate-500"
            )}
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
