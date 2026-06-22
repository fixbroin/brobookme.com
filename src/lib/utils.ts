import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text
}

export function getWorkingPeriods(hours: any): { start: string; end: string }[] {
  if (!hours) return [];
  let periods: { start: string; end: string }[] = [];
  if (Array.isArray(hours)) {
    periods = hours;
  } else if (hours.start && hours.end) {
    periods = [hours];
  }
  return periods
    .filter(p => p && p.start && p.end)
    .sort((a, b) => a.start.localeCompare(b.start));
}
