import React from "react";
import {
  BadgeCheck,
  CreditCard,
  Banknote,
  QrCode,
  Sparkles,
  RefreshCw,
  Receipt,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaymentMethod, ProductCondition } from "@/types/marketplace";

export type BadgeVariant =
  | "discount"
  | "verified"
  | "condition"
  | "payment"
  | "neutral"
  | "dark";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Quando variant="discount", pode passar direto a porcentagem ex: 20 -> "-20% OFF" */
  discountPercent?: number;
  /** Quando variant="condition", define o rótulo automático */
  condition?: ProductCondition;
  /** Quando variant="payment", renderiza ícone e rótulo da forma de pagamento */
  paymentMethod?: PaymentMethod;
  icon?: React.ReactNode;
  size?: "sm" | "md";
}

const CONDITION_MAP: Record<
  ProductCondition,
  { label: string; classes: string; icon: React.ReactNode }
> = {
  new: {
    label: "Novo",
    classes: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    icon: <Sparkles className="w-3 h-3" aria-hidden="true" />,
  },
  used: {
    label: "Seminovo / Usado",
    classes: "bg-amber-50 text-amber-700 border border-amber-100",
    icon: <RefreshCw className="w-3 h-3" aria-hidden="true" />,
  },
  refurbished: {
    label: "Recondicionado",
    classes: "bg-slate-100 text-slate-700 border border-slate-200/70",
    icon: <RefreshCw className="w-3 h-3" aria-hidden="true" />,
  },
};

const PAYMENT_MAP: Record<
  PaymentMethod,
  { label: string; icon: React.ReactNode }
> = {
  pix: {
    label: "Pix",
    icon: <QrCode className="w-3 h-3 text-emerald-600" aria-hidden="true" />,
  },
  credit_card: {
    label: "Cartão de Crédito",
    icon: <CreditCard className="w-3 h-3 text-slate-600" aria-hidden="true" />,
  },
  debit_card: {
    label: "Débito",
    icon: <CreditCard className="w-3 h-3 text-slate-600" aria-hidden="true" />,
  },
  cash: {
    label: "Dinheiro",
    icon: <Banknote className="w-3 h-3 text-emerald-700" aria-hidden="true" />,
  },
  payment_link: {
    label: "Link de Pagamento",
    icon: <Receipt className="w-3 h-3 text-slate-600" aria-hidden="true" />,
  },
  boleto: {
    label: "Boleto",
    icon: <Receipt className="w-3 h-3 text-slate-600" aria-hidden="true" />,
  },
  crediario: {
    label: "Crediário da Loja",
    icon: <Wallet className="w-3 h-3 text-blue-600" aria-hidden="true" />,
  },
};

export function Badge({
  variant = "neutral",
  discountPercent,
  condition,
  paymentMethod,
  icon,
  size = "sm",
  className,
  children,
  ...props
}: BadgeProps) {
  const sizeStyles =
    size === "sm"
      ? "px-2.5 py-0.5 text-[11px] gap-1"
      : "px-3 py-1 text-xs gap-1.5";

  if (variant === "discount") {
    const content =
      children ?? (discountPercent != null ? `-${discountPercent}% OFF` : "OFERTA");
    return (
      <span
        className={cn(
          "inline-flex items-center font-bold tracking-tight rounded-full bg-rose-500 text-white shadow-xs",
          sizeStyles,
          className
        )}
        {...props}
      >
        {icon}
        {content}
      </span>
    );
  }

  if (variant === "verified") {
    return (
      <span
        className={cn(
          "inline-flex items-center font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100/80",
          sizeStyles,
          className
        )}
        {...props}
      >
        {icon ?? <BadgeCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />}
        {children ?? "Loja Verificada"}
      </span>
    );
  }

  if (variant === "condition") {
    const condMeta = condition ? CONDITION_MAP[condition] : CONDITION_MAP.new;
    return (
      <span
        className={cn(
          "inline-flex items-center font-semibold rounded-full",
          condMeta.classes,
          sizeStyles,
          className
        )}
        {...props}
      >
        {icon ?? condMeta.icon}
        {children ?? condMeta.label}
      </span>
    );
  }

  if (variant === "payment") {
    const payMeta = paymentMethod ? PAYMENT_MAP[paymentMethod] : PAYMENT_MAP.pix;
    return (
      <span
        className={cn(
          "inline-flex items-center font-medium rounded-full bg-slate-100/90 text-slate-700 border border-slate-200/60",
          sizeStyles,
          className
        )}
        {...props}
      >
        {icon ?? payMeta.icon}
        {children ?? payMeta.label}
      </span>
    );
  }

  if (variant === "dark") {
    return (
      <span
        className={cn(
          "inline-flex items-center font-semibold rounded-full bg-slate-900 text-white",
          sizeStyles,
          className
        )}
        {...props}
      >
        {icon}
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200/50",
        sizeStyles,
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}

