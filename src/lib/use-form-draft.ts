"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Rascunho de formulário salvo no navegador (localStorage), para a pessoa não
 * perder o que já preencheu se fechar a aba, recarregar ou a conexão cair.
 *
 * - Restaura uma vez, depois de montar (sem divergência de hidratação).
 * - Salva a cada mudança, com um pequeno atraso.
 * - Expira sozinho (padrão 7 dias) e é apagado com `clear()` ao concluir.
 * - Nunca guarde senhas aqui.
 */

const PREFIX = "lapa-draft:";
const VERSION = 1;

interface StoredDraft<T> {
  v: number;
  savedAt: number;
  data: Partial<T>;
}

export interface UseFormDraftOptions {
  /** Desliga leitura e escrita (ex.: enquanto falta o id do dono). */
  enabled?: boolean;
  /** Validade do rascunho em dias. */
  ttlDays?: number;
  /** Atraso para salvar após a última mudança (ms). */
  debounceMs?: number;
}

export interface FormDraftControls {
  /** `true` quando um rascunho anterior foi restaurado nesta visita. */
  restored: boolean;
  /** Apaga o rascunho (ao concluir o envio ou ao "começar do zero"). */
  clear: () => void;
  /** Salva imediatamente (ex.: depois de um erro no envio). */
  saveNow: () => void;
  /** Esconde o aviso de rascunho restaurado sem apagar nada. */
  dismiss: () => void;
}

function storageKey(key: string) {
  return `${PREFIX}${key}`;
}

function readDraft<T>(key: string, ttlDays: number): Partial<T> | null {
  try {
    const raw = window.localStorage.getItem(storageKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft<T>;
    const expired = Date.now() - parsed.savedAt > ttlDays * 24 * 60 * 60 * 1000;
    if (parsed.v !== VERSION || expired || !parsed.data) {
      window.localStorage.removeItem(storageKey(key));
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeDraft<T>(key: string, data: T) {
  try {
    const payload: StoredDraft<T> = { v: VERSION, savedAt: Date.now(), data };
    window.localStorage.setItem(storageKey(key), JSON.stringify(payload));
  } catch {
    // Armazenamento cheio ou bloqueado (aba anônima): segue sem rascunho
  }
}

/** Apaga um rascunho fora do formulário (ex.: depois de um redirecionamento). */
export function clearFormDraft(key: string) {
  try {
    window.localStorage.removeItem(storageKey(key));
  } catch {
    // ignora
  }
}

/**
 * @param key      Identificador único do formulário (inclua o id do dono).
 * @param values   Valores atuais a preservar (só dados serializáveis).
 * @param restore  Recebe o rascunho salvo e devolve os valores ao formulário.
 */
export function useFormDraft<T extends Record<string, unknown>>(
  key: string,
  values: T,
  restore: (draft: Partial<T>) => void,
  { enabled = true, ttlDays = 7, debounceMs = 400 }: UseFormDraftOptions = {}
): FormDraftControls {
  const [restored, setRestored] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const restoreRef = useRef(restore);
  const valuesRef = useRef(values);
  const skipNextSaveRef = useRef(false);
  const baselineRef = useRef<string | null>(null);

  useEffect(() => {
    restoreRef.current = restore;
    valuesRef.current = values;
  });

  // 1. Restaurar uma vez, depois de montar (localStorage só existe no navegador;
  // o callback fora do corpo do efeito evita render em cascata na montagem)
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => {
      const initial = JSON.stringify(valuesRef.current);
      const draft = readDraft<T>(key, ttlDays);
      if (draft && Object.keys(draft).length > 0) {
        if (JSON.stringify(draft) === initial) {
          // Rascunho igual ao formulário vazio: nada a retomar
          clearFormDraft(key);
        } else {
          skipNextSaveRef.current = true;
          restoreRef.current(draft);
          setRestored(true);
        }
      }
      // Só salva quando algo mudar em relação ao que está na tela agora
      baselineRef.current = initial;
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [key, enabled, ttlDays]);

  // 2. Salvar a cada mudança (só depois de restaurar, para não sobrescrever)
  const serialized = JSON.stringify(values);
  useEffect(() => {
    if (!enabled || !hydrated) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    // Nada mudou desde que a tela abriu: não cria rascunho vazio
    if (serialized === baselineRef.current) return;
    baselineRef.current = null;
    const timer = window.setTimeout(() => {
      writeDraft(key, JSON.parse(serialized) as T);
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [serialized, key, enabled, hydrated, debounceMs]);

  const clear = useCallback(() => {
    // Evita que um salvamento pendente recrie o rascunho logo depois
    skipNextSaveRef.current = true;
    clearFormDraft(key);
    setRestored(false);
  }, [key]);

  const saveNow = useCallback(() => {
    if (enabled) writeDraft(key, valuesRef.current);
  }, [key, enabled]);

  const dismiss = useCallback(() => setRestored(false), []);

  return { restored, clear, saveNow, dismiss };
}
