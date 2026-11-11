import type {
  DaySchedule,
  SpecialHour,
  WeeklyBusinessHours,
} from "@/types/marketplace";

export type StoreAvailabilityState = "open" | "lunch" | "closing_soon" | "closed";

export interface FormattedDaySchedule {
  dayOfWeek: number;
  dayName: string;
  shortName: string;
  isToday: boolean;
  isClosed: boolean;
  hoursText: string;
  lunchText?: string | null;
}

export interface StoreOpenStatusResult {
  state: StoreAvailabilityState;
  isOpen: boolean;
  label: string;
  shortLabel: string;
  detailText: string;
  weeklySchedule: FormattedDaySchedule[];
  specialHours: SpecialHour[];
  activeSpecialHour?: SpecialHour | null;
}

const DAY_NAMES: Record<number, { full: string; short: string; keys: string[] }> = {
  0: { full: "Domingo", short: "Dom", keys: ["0", "dom", "sun", "sunday", "domingo"] },
  1: { full: "Segunda-feira", short: "Seg", keys: ["1", "seg", "mon", "monday", "segunda"] },
  2: { full: "Terça-feira", short: "Ter", keys: ["2", "ter", "tue", "tuesday", "terca", "terça"] },
  3: { full: "Quarta-feira", short: "Qua", keys: ["3", "qua", "wed", "wednesday", "quarta"] },
  4: { full: "Quinta-feira", short: "Qui", keys: ["4", "qui", "thu", "thursday", "quinta"] },
  5: { full: "Sexta-feira", short: "Sex", keys: ["5", "sex", "fri", "friday", "sexta"] },
  6: { full: "Sábado", short: "Sáb", keys: ["6", "sab", "sat", "saturday", "sabado", "sábado"] },
};

const DEFAULT_COMMERCE_SCHEDULE: Record<number, DaySchedule> = {
  0: { dayOfWeek: 0, isClosed: true },
  1: { dayOfWeek: 1, isClosed: false, openTime: "08:00", closeTime: "18:00", lunchStart: "12:00", lunchEnd: "14:00" },
  2: { dayOfWeek: 2, isClosed: false, openTime: "08:00", closeTime: "18:00", lunchStart: "12:00", lunchEnd: "14:00" },
  3: { dayOfWeek: 3, isClosed: false, openTime: "08:00", closeTime: "18:00", lunchStart: "12:00", lunchEnd: "14:00" },
  4: { dayOfWeek: 4, isClosed: false, openTime: "08:00", closeTime: "18:00", lunchStart: "12:00", lunchEnd: "14:00" },
  5: { dayOfWeek: 5, isClosed: false, openTime: "08:00", closeTime: "18:00", lunchStart: "12:00", lunchEnd: "14:00" },
  6: { dayOfWeek: 6, isClosed: false, openTime: "08:00", closeTime: "13:00", lunchStart: null, lunchEnd: null },
};

function parseTimeToMinutes(time?: string | null): number | null {
  if (!time || !/^\d{1,2}:\d{2}$/.test(time.trim())) return null;
  const [hoursStr, minutesStr] = time.trim().split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function normalizeWeeklySchedule(
  businessHours?: WeeklyBusinessHours | null
): Record<number, DaySchedule> {
  if (!businessHours) {
    return DEFAULT_COMMERCE_SCHEDULE;
  }

  const map: Record<number, DaySchedule> = { ...DEFAULT_COMMERCE_SCHEDULE };

  if (Array.isArray(businessHours)) {
    for (let i = 0; i < businessHours.length; i++) {
      const item = businessHours[i];
      const dayIdx = typeof item.dayOfWeek === "number" ? item.dayOfWeek : i % 7;
      map[dayIdx] = { ...map[dayIdx], ...item, dayOfWeek: dayIdx };
    }
    return map;
  }

  const entries = Object.entries(businessHours);
  for (const [rawKey, schedule] of entries) {
    const keyLower = rawKey.toLowerCase().trim();
    for (const [dayNumStr, meta] of Object.entries(DAY_NAMES)) {
      const dayNum = Number(dayNumStr);
      if (meta.keys.includes(keyLower)) {
        map[dayNum] = { ...map[dayNum], ...schedule, dayOfWeek: dayNum };
        break;
      }
    }
  }

  return map;
}

/**
 * Calcula o status em tempo real de funcionamento da loja em Bom Jesus da Lapa (UTC-3),
 * considerando horários comerciais da semana, intervalo de almoço, aviso de fechamento próximo
 * e datas especiais/feriados locais (ex: Romaria).
 */
export function getStoreOpenStatus(options?: {
  businessHours?: WeeklyBusinessHours | null;
  specialHours?: SpecialHour[] | null;
  isOpenOverride?: boolean | null;
  now?: Date;
}): StoreOpenStatusResult {
  const now = options?.now ?? new Date();
  // Ajusta para horário da Bahia (America/Bahia, UTC-3)
  const bahiaString = now.toLocaleString("en-US", { timeZone: "America/Bahia" });
  const localNow = new Date(bahiaString);

  const currentDay = localNow.getDay();
  const currentMinutes = localNow.getHours() * 60 + localNow.getMinutes();

  const year = localNow.getFullYear();
  const month = String(localNow.getMonth() + 1).padStart(2, "0");
  const day = String(localNow.getDate()).padStart(2, "0");
  const todayIso = `${year}-${month}-${day}`;

  const normalizedMap = normalizeWeeklySchedule(options?.businessHours);
  const specialHours = options?.specialHours ?? [];

  const weeklySchedule: FormattedDaySchedule[] = [1, 2, 3, 4, 5, 6, 0].map(
    (dayIdx) => {
      const sched = normalizedMap[dayIdx] ?? { isClosed: true };
      const meta = DAY_NAMES[dayIdx];
      const isClosed = Boolean(sched.isClosed || !sched.openTime || !sched.closeTime);
      const hasLunch = Boolean(sched.lunchStart && sched.lunchEnd);

      return {
        dayOfWeek: dayIdx,
        dayName: meta.full,
        shortName: meta.short,
        isToday: dayIdx === currentDay,
        isClosed,
        hoursText: isClosed
          ? "Fechada"
          : `${sched.openTime} às ${sched.closeTime}`,
        lunchText:
          !isClosed && hasLunch
            ? `Almoço: ${sched.lunchStart} às ${sched.lunchEnd}`
            : null,
      };
    }
  );

  // Override manual do lojista
  if (options?.isOpenOverride === true) {
    return {
      state: "open",
      isOpen: true,
      label: "Aberta agora",
      shortLabel: "Aberta",
      detailText: "Atendimento ativo agora",
      weeklySchedule,
      specialHours,
      activeSpecialHour: null,
    };
  }
  if (options?.isOpenOverride === false) {
    return {
      state: "closed",
      isOpen: false,
      label: "Fechada",
      shortLabel: "Fechada",
      detailText: "Fechada temporariamente",
      weeklySchedule,
      specialHours,
      activeSpecialHour: null,
    };
  }

  // Verifica se hoje é um horário especial / feriado
  const activeSpecial = specialHours.find((sh) => sh.date === todayIso) ?? null;

  const todayConfig: DaySchedule = activeSpecial
    ? {
        dayOfWeek: currentDay,
        isClosed: activeSpecial.isClosed,
        openTime: activeSpecial.openTime,
        closeTime: activeSpecial.closeTime,
        lunchStart: null,
        lunchEnd: null,
      }
    : normalizedMap[currentDay];

  if (!todayConfig || todayConfig.isClosed) {
    return {
      state: "closed",
      isOpen: false,
      label: "Fechada",
      shortLabel: "Fechada",
      detailText: activeSpecial
        ? `Fechada (${activeSpecial.label})`
        : "Fechada hoje",
      weeklySchedule,
      specialHours,
      activeSpecialHour: activeSpecial,
    };
  }

  const openMin = parseTimeToMinutes(todayConfig.openTime);
  const closeMin = parseTimeToMinutes(todayConfig.closeTime);
  const lunchStartMin = parseTimeToMinutes(todayConfig.lunchStart);
  const lunchEndMin = parseTimeToMinutes(todayConfig.lunchEnd);

  if (openMin == null || closeMin == null) {
    return {
      state: "closed",
      isOpen: false,
      label: "Fechada",
      shortLabel: "Fechada",
      detailText: "Horário não informado",
      weeklySchedule,
      specialHours,
      activeSpecialHour: activeSpecial,
    };
  }

  // Antes de abrir
  if (currentMinutes < openMin) {
    return {
      state: "closed",
      isOpen: false,
      label: "Fechada",
      shortLabel: "Fechada",
      detailText: `Abre hoje às ${todayConfig.openTime}`,
      weeklySchedule,
      specialHours,
      activeSpecialHour: activeSpecial,
    };
  }

  // Depois de fechar
  if (currentMinutes >= closeMin) {
    return {
      state: "closed",
      isOpen: false,
      label: "Fechada",
      shortLabel: "Fechada",
      detailText: `Fechou às ${todayConfig.closeTime}`,
      weeklySchedule,
      specialHours,
      activeSpecialHour: activeSpecial,
    };
  }

  // Intervalo de almoço
  if (
    lunchStartMin != null &&
    lunchEndMin != null &&
    currentMinutes >= lunchStartMin &&
    currentMinutes < lunchEndMin
  ) {
    return {
      state: "lunch",
      isOpen: false,
      label: "Horário de almoço",
      shortLabel: "Almoço",
      detailText: `Volta às ${todayConfig.lunchEnd}`,
      weeklySchedule,
      specialHours,
      activeSpecialHour: activeSpecial,
    };
  }

  // Fecha em até 30 minutos (ou para o almoço em até 20 minutos)
  const minutesToClose = closeMin - currentMinutes;
  const minutesToLunch =
    lunchStartMin != null && currentMinutes < lunchStartMin
      ? lunchStartMin - currentMinutes
      : null;

  if (minutesToClose <= 30) {
    return {
      state: "closing_soon",
      isOpen: true,
      label: "Fecha logo",
      shortLabel: "Fecha logo",
      detailText: `Fecha às ${todayConfig.closeTime}`,
      weeklySchedule,
      specialHours,
      activeSpecialHour: activeSpecial,
    };
  }

  if (minutesToLunch != null && minutesToLunch <= 20) {
    return {
      state: "closing_soon",
      isOpen: true,
      label: "Pausa logo",
      shortLabel: "Fecha logo",
      detailText: `Pausa p/ almoço às ${todayConfig.lunchStart}`,
      weeklySchedule,
      specialHours,
      activeSpecialHour: activeSpecial,
    };
  }

  return {
    state: "open",
    isOpen: true,
    label: "Aberta agora",
    shortLabel: "Aberta agora",
    detailText: `Aberta até ${todayConfig.closeTime}`,
    weeklySchedule,
    specialHours,
    activeSpecialHour: activeSpecial,
  };
}

