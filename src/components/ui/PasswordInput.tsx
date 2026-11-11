"use client";

import React, { useState } from "react";
import { Input, type InputProps } from "./Input";

/**
 * Campo de senha com alternância "Mostrar / Ocultar".
 */
export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<InputProps, "type" | "rightIcon">
>(({ className, ...props }, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      ref={ref}
      type={visible ? "text" : "password"}
      className={className ? `pr-20 ${className}` : "pr-20"}
      rightIcon={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          className="text-[13px] text-slate-500 hover:text-slate-900 cursor-pointer"
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      }
      {...props}
    />
  );
});

PasswordInput.displayName = "PasswordInput";
