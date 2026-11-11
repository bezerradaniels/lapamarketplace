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
      pill = false,
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

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-4 text-slate-500 pointer-events-none inline-flex items-center">
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
              "appearance-none cursor-pointer pl-4 pr-11",
              inputSize === "lg"
                ? "h-13 rounded-2xl text-[15px]"
                : "h-11.5 rounded-[15px] text-sm",
              pill && "rounded-full",
              Boolean(leftIcon) && "pl-11",
              Boolean(error) && "bg-white ring-2 ring-offer focus:ring-offer",
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

          <span className="absolute right-4 text-slate-500 pointer-events-none inline-flex items-center">
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

