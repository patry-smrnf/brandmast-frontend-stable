import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

//funkcja do skladania klas CSS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs)) // scala madrze
}
