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
  const datetimeLocalMatch = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
  );
  let d = new Date();
  let hh: number;
  let mm: number;

  if (datetimeLocalMatch) {
    const [, year, month, day, hours, minutes] = datetimeLocalMatch;
    hh = Number(hours);
    mm = Number(minutes);
    d = new Date(Number(year), Number(month) - 1, Number(day), hh, mm, 0, 0);
  } else {
    // Already a full ISO datetime with timezone/seconds — pass through as-is
    if (trimmed.length > 16) return trimmed;
    [hh, mm] = trimmed.split(":").map(Number);
    if (isNaN(hh) || isNaN(mm)) return null;
    d.setHours(hh, mm, 0, 0);
  }

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

export function isoToDatetimeLocalInput(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  const datetimeLocalMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  if (datetimeLocalMatch) return datetimeLocalMatch[1];

  const timeOnlyMatch = trimmed.match(/^(\d{2}):(\d{2})$/);
  if (timeOnlyMatch) {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}` +
      `T${timeOnlyMatch[1]}:${timeOnlyMatch[2]}`
    );
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}` +
    `T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
  );
}
