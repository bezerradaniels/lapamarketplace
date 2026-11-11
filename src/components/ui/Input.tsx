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
  "w-full bg-slate-100 text-slate-900 outline-none transition-[background-color,box-shadow] duration-150 ease-out placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900 disabled:opacity-60 disabled:cursor-not-allowed";

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
      pill = false,
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

    return (
      <div className={cn("flex flex-col gap-1.5 w-full", containerClassName)}>
        {label && (
          <label htmlFor={inputId} className={fieldLabelClasses}>
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-4 text-slate-500 pointer-events-none inline-flex items-center">
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
              "px-4",
              inputSize === "lg"
                ? "h-13 rounded-2xl text-[15px]"
                : "h-11.5 rounded-[15px] text-sm",
              pill && "rounded-full",
              Boolean(leftIcon) && "pl-11",
              Boolean(rightIcon) && "pr-11",
              valid &&
                !error &&
                "bg-white ring-2 ring-whatsapp focus:ring-whatsapp",
              Boolean(error) && "bg-white ring-2 ring-offer focus:ring-offer",
              className
            )}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-4 text-slate-500 inline-flex items-center">
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
