"use client";

import React, { useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldBaseClasses, fieldLabelClasses } from "./Input";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  placeholder?: string;
  leftIcon?: React.ReactNode;
  pill?: boolean;
  /** `lg` = 52px (formulários), `md` = 46px (cards compactos e painéis). */
  inputSize?: "md" | "lg";
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      containerClassName,
      label,
      error,
      helperText,
      options,
      placeholder,
      leftIcon,
      pill = true,
      inputSize = "lg",
      id,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    const radiusClass = pill ? "rounded-full" : "rounded-2xl";

    return (
      <div className={cn("flex flex-col gap-1.5 w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className={fieldLabelClasses}
          >
            {label}
          </label>
        )}

        <div className={cn("relative flex items-center lapa-aurora-glow", radiusClass)}>
          {leftIcon && (
            <span className="absolute left-5 text-slate-500 pointer-events-none inline-flex items-center">
              {leftIcon}
            </span>
          )}

          <select
            ref={ref}
            id={selectId}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              fieldBaseClasses,
              "appearance-none cursor-pointer pl-5.5 pr-12",
              radiusClass,
              inputSize === "lg" ? "h-13 text-[15px]" : "h-11.5 text-sm",
              Boolean(leftIcon) && "pl-13",
              Boolean(error) && "border-offer focus:border-offer",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options
              ? options.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <span className="absolute right-5 text-slate-500 pointer-events-none inline-flex items-center">
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          </span>
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
          <p id={helperId} className="text-xs text-slate-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";

