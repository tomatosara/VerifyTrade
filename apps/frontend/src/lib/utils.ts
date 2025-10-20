/* apps/frontend/src/lib/utils.ts */
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/** 合併條件式 className，並自動去除 Tailwind 衝突 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
