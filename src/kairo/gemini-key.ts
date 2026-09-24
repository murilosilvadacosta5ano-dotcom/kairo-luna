import { useEffect, useState } from "react";

const STORAGE_KEY = "kairo-gemini-key";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function normalizeGeminiKey(raw: string): string {
  return raw.trim().replace(/^["']+|["']+$/g, "");
}

export function getGeminiKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return normalizeGeminiKey(localStorage.getItem(STORAGE_KEY) ?? "");
  } catch {
    return "";
  }
}

export function setGeminiKey(value: string) {
  const next = normalizeGeminiKey(value);
  try {
    if (next) localStorage.setItem(STORAGE_KEY, next);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* quota / private mode */
  }
  emit();
}

export function useGeminiKey() {
  const [key, setKey] = useState("");
  useEffect(() => {
    const sync = () => setKey(getGeminiKey());
    sync();
    listeners.add(sync);
    window.addEventListener("storage", sync);
    return () => {
      listeners.delete(sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return key;
}
