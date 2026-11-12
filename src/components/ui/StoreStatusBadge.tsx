"use client";

import React, { useId, useRef } from "react";
import { Clock, Calendar, X, ChevronRight } from "lucide-react";
import {
  getStoreOpenStatus,
  type StoreAvailabilityState,
} from "@/lib/store-hours";
import { cn } from "@/lib/utils";
import type { SpecialHour, WeeklyBusinessHours } from "@/types/marketplace";

export interface StoreStatusBadgeProps {
  storeName?: string;
  businessHours?: WeeklyBusinessHours | null;
  specialHours?: SpecialHour[] | null;
  isOpenOverride?: boolean | null;
  /** Modo compacto ideal para headers de postagens no feed */
  compact?: boolean;
  className?: string;
}

const STATE_STYLES: Record<
  StoreAvailabilityState,
  {
    pillBg: string;
    dotColor: string;
    pingColor: string;
    pulse: boolean;
  }
> = {
  open: {
    pillBg:
      "bg-emerald-100 text-emerald-800 hover:bg-emerald-200/70",
    dotColor: "bg-emerald-600",
    pingColor: "bg-emerald-400",
    pulse: true,
  },
  lunch: {
    pillBg:
      "bg-amber-100 text-amber-800 hover:bg-amber-200/70",
    dotColor: "bg-amber-600",
    pingColor: "bg-amber-400",
    pulse: true,
  },
  closing_soon: {
    pillBg:
      "bg-amber-100 text-amber-800 hover:bg-amber-200/70",
    dotColor: "bg-amber-600",
    pingColor: "bg-amber-400",
    pulse: true,
  },
  closed: {
    pillBg:
      "bg-slate-100 text-slate-600 hover:bg-slate-200/70",
    dotColor: "bg-slate-400",
    pingColor: "bg-slate-300",
    pulse: false,
  },
};

export function StoreStatusBadge({
  storeName,
  businessHours,
  specialHours,
  isOpenOverride,
  compact = false,
  className,
}: StoreStatusBadgeProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressedOutsideRef = useRef(false);
  const titleId = useId();

  const status = getStoreOpenStatus({
    businessHours,
    specialHours,
    isOpenOverride,
  });

  const style = STATE_STYLES[status.state];

  const openModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    dialogRef.current?.showModal();
  };

  const isOutsideDialog = (
    e: React.PointerEvent<HTMLDialogElement>,
    dialog: HTMLDialogElement
  ) => {
    const rect = dialog.getBoundingClientRect();
    return (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        title={`${status.label} • ${status.detailText} (Clique para ver horários)`}
        className={cn(
          "inline-flex items-center max-w-full rounded-full font-semibold transition-colors duration-150 cursor-pointer select-none touch-manipulation",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light",
          compact
            ? "px-2.5 py-1 text-[11px] gap-1.5"
            : "px-2.5 py-1 text-[11px] sm:text-xs gap-1.5",
          style.pillBg,
          className
        )}
      >
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {style.pulse && (
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                style.pingColor
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex rounded-full h-1.5 w-1.5",
              style.dotColor
            )}
          />
        </span>

        <span className="truncate">
          {compact ? status.shortLabel : status.label}
        </span>

        {!compact && (
          <>
            <span className="text-current/40">•</span>
            <span className="font-normal opacity-85 truncate">
              {status.detailText}
            </span>
            <ChevronRight
              className="w-3.5 h-3.5 opacity-60 shrink-0 -mr-0.5"
              aria-hidden="true"
            />
          </>
        )}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        closedby="any"
        onPointerDown={(e) => {
          if (dialogRef.current) {
            pressedOutsideRef.current = isOutsideDialog(e, dialogRef.current);
          }
        }}
        onPointerUp={(e) => {
          if (
            dialogRef.current &&
            pressedOutsideRef.current &&
            isOutsideDialog(e, dialogRef.current)
          ) {
            dialogRef.current.close();
          }
          pressedOutsideRef.current = false;
        }}
        className={cn(
          "m-auto w-[calc(100%-2rem)] max-w-md rounded-[28px] bg-white p-6 text-slate-900 shadow-float",
          "backdrop:bg-slate-900/50"
        )}
      >
        <div className="flex items-start justify-between gap-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10.5 h-10.5 rounded-[14px] bg-brand-soft flex items-center justify-center text-slate-900 shrink-0">
              <Clock className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id={titleId}
                className="text-[17px] font-extrabold text-slate-900 leading-tight"
              >
                Horário de Funcionamento
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {storeName ? `${storeName} • ` : ""}Bom Jesus da Lapa - BA
              </p>
            </div>
          </div>

          <form method="dialog">
            <button
              type="submit"
              aria-label="Fechar horários de funcionamento"
              autoFocus
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>
        </div>

        {/* Status atual em destaque */}
        <div className="mt-4 flex items-center justify-between rounded-[18px] bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              {style.pulse && (
                <span
                  className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    style.pingColor
                  )}
                />
              )}
              <span
                className={cn(
                  "relative inline-flex rounded-full h-2.5 w-2.5",
                  style.dotColor
                )}
              />
            </span>
            <span className="text-xs font-bold text-slate-900">
              {status.label}
            </span>
          </div>
          <span className="text-xs font-medium text-slate-600">
            {status.detailText}
          </span>
        </div>

        {/* Horários da semana */}
        <div className="mt-4 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Horários da Semana
          </p>
          <ul
            className={cn(
              "divide-y divide-slate-100 rounded-[18px] overflow-hidden bg-white",
              "ring-line"
            )}
          >
            {status.weeklySchedule.map((day) => (
              <li
                key={day.dayOfWeek}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 text-sm",
                  day.isToday
                    ? "bg-brand-soft font-semibold text-slate-900"
                    : "text-slate-600"
                )}
              >
                <div className="flex items-center gap-2">
                  <span>{day.dayName}</span>
                  {day.isToday && (
                    <span className="rounded-full bg-slate-900 text-white px-2 py-0.5 text-[10px] font-semibold">
                      Hoje
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      day.isClosed ? "text-slate-400" : ""
                    )}
                  >
                    {day.hoursText}
                  </span>
                  {day.lunchText && (
                    <span className="block text-[10px] font-normal text-slate-400">
                      {day.lunchText}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Horários especiais / feriados */}
        {status.specialHours.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
              Datas Especiais e Feriados
            </p>
            <ul className="space-y-1.5">
              {status.specialHours.map((sp, idx) => (
                <li
                  key={sp.id ?? `${sp.date}-${idx}`}
                  className="flex items-center justify-between rounded-[14px] bg-amber-100 px-3.5 py-2.5 text-xs text-amber-800"
                >
                  <div>
                    <span className="font-semibold">{sp.label}</span>
                    <span className="block text-[11px] text-amber-800/80">
                      {sp.date}
                    </span>
                  </div>
                  <span className="font-bold">
                    {sp.isClosed
                      ? "Fechada"
                      : `${sp.openTime} às ${sp.closeTime}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form method="dialog" className="mt-5">
          <button
            type="submit"
            className="w-full h-13 rounded-[17px] bg-slate-900 text-white font-display text-[15px] font-bold hover:bg-slate-800 active:scale-[0.98] transition duration-150 cursor-pointer"
          >
            Entendi
          </button>
        </form>
      </dialog>
    </>
  );
}
