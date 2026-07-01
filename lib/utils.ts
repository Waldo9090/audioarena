import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatElo(value: number) {
  return Math.round(value).toLocaleString('en-US')
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}
