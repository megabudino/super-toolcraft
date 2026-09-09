import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Only the class helper is reachable from this section; blog helpers are omitted. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
