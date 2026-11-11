import type {
  DaySchedule,
  SpecialHour,
  WeeklyBusinessHours,
} from "@/types/marketplace";

export interface StoreOpenStatusResult {
  isOpen: boolean;
  statusLabel: string; // Ex: "Aberta agora • Fecha às 18:00" | "Horário de almoço • Volta às 14:00" | "Fechada • Abre às 08:00" | "Horário Especial de Romaria • Até 20:00"
  badgeColor: "emerald" | "amber" | "rose";
}

function parseTimeToMinutes(time?: string | null): number | null {
  if (!time || !/^\d{1,2}:\d{2}$/.test(time.trim())) return null;
  const [hStr, mStr] = time.trim().split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

const DEFAULT_LAPA_HOURS: Record<number, DaySchedule> = {
  0: { dayOfWeek: 0, isClosed: true },
  1: {
    dayOfWeek: 1,
    isClosed: false,
    openTime: "08:00",
    closeTime: "18:00",
    lunchStart: "12:00",
    lunchEnd: "14:00",
  },
  2: {
    dayOfWeek: 2,
    isClosed: false,
    openTime: "08:00",
    closeTime: "18:00",
    lunchStart: "12:00",
    lunchEnd: "14:00",
  },
  3: {
    dayOfWeek: 3,
    isClosed: false,
    openTime: "08:00",
    closeTime: "18:00",
    lunchStart: "12:00",
    lunchEnd: "14:00",
  },
  4: {
    dayOfWeek: 4,
    isClosed: false,
    openTime: "08:00",
    closeTime: "18:00",
    lunchStart: "12:00",
    lunchEnd: "14:00",
  },
  5: {
    dayOfWeek: 5,
    isClosed: false,
    openTime: "08:00",
    closeTime: "18:00",
    lunchStart: "12:00",
    lunchEnd: "14:00",
  },
  6: {
    dayOfWeek: 6,
    isClosed: false,
    openTime: "08:00",
    closeTime: "13:00",
    lunchStart: null,
    lunchEnd: null,
  },
};

/**
 * Função utilitária pura que calcula o horário de funcionamento atual no fuso America/Bahia (UTC-3).
 * Prioriza datas especiais / feriados (`specialHours`) e em seguida o dia da semana (`businessHours`).
 *
 * É 100% informativa para quem deseja ir presencialmente à loja física; nunca bloqueia pedidos.
 */
export function getStoreOpenStatus(
  businessHours?: WeeklyBusinessHours | null,
  specialHours?: SpecialHour[] | null,
  options?: { now?: Date; isOpenOverride?: boolean | null }
): StoreOpenStatusResult {
  if (options?.isOpenOverride === true) {
    return {
      isOpen: true,
      statusLabel: "Aberta agora • Atendimento ativo",
      badgeColor: "emerald",
    };
  }
  if (options?.isOpenOverride === false) {
    return {
      isOpen: false,
      statusLabel: "Fechada • Temporariamente fechada",
      badgeColor: "rose",
    };
  }

  // Fuso oficial de Bom Jesus da Lapa - BA (America/Bahia, UTC-3)
  const baseDate = options?.now ?? new Date();
  const localDate = new Date(
    baseDate.toLocaleString("en-US", { timeZone: "America/Bahia" })
  );

  const currentDay = localDate.getDay();
  const currentMinutes = localDate.getHours() * 60 + localDate.getMinutes();

  const y = localDate.getFullYear();
  const m = String(localDate.getMonth() + 1).padStart(2, "0");
  const d = String(localDate.getDate()).padStart(2, "0");
  const todayIso = `${y}-${m}-${d}`;

  // 1. Verifica se hoje consta em datas especiais (Romaria, feriados)
  const specialList = specialHours || [];
  const activeSpecial = specialList.find((sh) => sh.date === todayIso);

  if (activeSpecial) {
    if (activeSpecial.isClosed) {
      return {
        isOpen: false,
        statusLabel: `Fechada hoje (${activeSpecial.label})`,
        badgeColor: "rose",
      };
    }

    const spOpen = parseTimeToMinutes(activeSpecial.openTime);
    const spClose = parseTimeToMinutes(activeSpecial.closeTime);

    if (spOpen != null && spClose != null) {
      if (currentMinutes < spOpen) {
        return {
          isOpen: false,
          statusLabel: `${activeSpecial.label} • Abre às ${activeSpecial.openTime}`,
          badgeColor: "amber",
        };
      }
      if (currentMinutes >= spClose) {
        return {
          isOpen: false,
          statusLabel: `${activeSpecial.label} • Fechou às ${activeSpecial.closeTime}`,
          badgeColor: "rose",
        };
      }
      return {
        isOpen: true,
        statusLabel: `${activeSpecial.label} • Até ${activeSpecial.closeTime}`,
        badgeColor: "emerald",
      };
    }
  }

  // 2. Normaliza horários regulares da semana
  let weekMap = DEFAULT_LAPA_HOURS;
  if (businessHours) {
    if (Array.isArray(businessHours)) {
      const copy: Record<number, DaySchedule> = { ...DEFAULT_LAPA_HOURS };
      for (let i = 0; i < businessHours.length; i++) {
        const item = businessHours[i];
        const dayIdx = typeof item.dayOfWeek === "number" ? item.dayOfWeek : i;
        copy[dayIdx] = { ...copy[dayIdx], ...item };
      }
      weekMap = copy;
    } else {
      const copy: Record<number, DaySchedule> = { ...DEFAULT_LAPA_HOURS };
      for (const [k, v] of Object.entries(businessHours)) {
        const num = Number(k);
        if (!Number.isNaN(num)) {
          copy[num] = { ...copy[num], ...v };
        }
      }
      weekMap = copy;
    }
  }

  const todayConfig = weekMap[currentDay] ?? { isClosed: true };
  if (todayConfig.isClosed || !todayConfig.openTime || !todayConfig.closeTime) {
    return {
      isOpen: false,
      statusLabel: "Fechada hoje",
      badgeColor: "rose",
    };
  }

  const openMin = parseTimeToMinutes(todayConfig.openTime);
  const closeMin = parseTimeToMinutes(todayConfig.closeTime);
  const lunchStart = parseTimeToMinutes(todayConfig.lunchStart);
  const lunchEnd = parseTimeToMinutes(todayConfig.lunchEnd);

  if (openMin == null || closeMin == null) {
    return {
      isOpen: false,
      statusLabel: "Fechada hoje",
      badgeColor: "rose",
    };
  }

  if (currentMinutes < openMin) {
    return {
      isOpen: false,
      statusLabel: `Fechada • Abre às ${todayConfig.openTime}`,
      badgeColor: "amber",
    };
  }

  if (currentMinutes >= closeMin) {
    return {
      isOpen: false,
      statusLabel: `Fechada • Fechou às ${todayConfig.closeTime}`,
      badgeColor: "rose",
    };
  }

  // Intervalo de Almoço
  if (
    lunchStart != null &&
    lunchEnd != null &&
    currentMinutes >= lunchStart &&
    currentMinutes < lunchEnd
  ) {
    return {
      isOpen: false,
      statusLabel: `Horário de almoço • Volta às ${todayConfig.lunchEnd}`,
      badgeColor: "amber",
    };
  }

  // Quase fechando (30 min)
  if (closeMin - currentMinutes <= 30) {
    return {
      isOpen: true,
      statusLabel: `Fecha logo • Aberta até ${todayConfig.closeTime}`,
      badgeColor: "amber",
    };
  }

  return {
    isOpen: true,
    statusLabel: `Aberta agora • Fecha às ${todayConfig.closeTime}`,
    badgeColor: "emerald",
  };
}

