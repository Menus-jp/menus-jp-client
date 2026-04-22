import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert a "HH:MM" time string to a full ISO-8601 datetime string
 * required by the Django REST API (e.g. "2026-04-22T09:00:00+09:00").
 * Uses today's local date and the local timezone offset so the time
 * the user typed is preserved exactly.
 * Returns null/empty passthrough unchanged.
 */
export function timeToISODatetime(time: string | null | undefined): string | null {
  if (!time) return null;
  const trimmed = time.trim();
  // Already a full ISO datetime — pass through as-is
  if (trimmed.length > 10) return trimmed;
  const [hh, mm] = trimmed.split(":").map(Number);
  if (isNaN(hh) || isNaN(mm)) return null;
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  // Build offset string like "+09:00"
  const offsetMin = -d.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const absMin = Math.abs(offsetMin);
  const offH = String(Math.floor(absMin / 60)).padStart(2, "0");
  const offM = String(absMin % 60).padStart(2, "0");
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(hh)}:${pad(mm)}:00${sign}${offH}:${offM}`
  );
}
