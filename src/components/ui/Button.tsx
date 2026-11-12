"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "whatsapp"
  | "brand"
  | "outline"
  | "ghost";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover active:bg-brand-hover",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
  whatsapp: "bg-whatsapp text-white hover:bg-whatsapp-strong",
  brand: "bg-brand text-white hover:bg-brand-hover",
  outline: "bg-white text-brand shadow-[inset_0_0_0_1.5px_#264E9C] hover:bg-brand-soft",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900",
};

export const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5 rounded-full",
  md: "h-11.5 px-5 text-sm gap-2 rounded-full",
  lg: "h-14 px-6 text-base gap-2.5 rounded-full",
};

export const buttonBaseClasses =
  "relative inline-flex items-center justify-center font-display font-semibold transition-[background-color,color,transform,box-shadow] duration-150 ease-out select-none cursor-pointer touch-manipulation active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-light disabled:opacity-55 disabled:pointer-events-none";

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      leftIcon,
      rightIcon,
      isLoading = false,
      fullWidth = false,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        className={cn(
          buttonBaseClasses,
          buttonVariantClasses[variant],
          buttonSizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {/* Loading: o spinner entra no lugar do texto, sem mudar a largura */}
        {isLoading && (
          <span className="absolute inset-0 grid place-items-center">
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          </span>
        )}
        <span
          className={cn(
            "inline-flex items-center justify-center gap-[inherit] min-w-0",
            isLoading && "invisible"
          )}
        >
          {leftIcon && <span className="shrink-0 inline-flex">{leftIcon}</span>}
          {children && <span className="truncate">{children}</span>}
          {rightIcon && (
            <span className="shrink-0 inline-flex">{rightIcon}</span>
          )}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";
