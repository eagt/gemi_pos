import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateInvoiceNumber(prefix: string, date: Date | string): string {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear().toString()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')

  return `${prefix}-${day}${month}${year}-${hours}${minutes}`
}

export function getBasePrefix(shopName: string): string {
  const name = shopName.trim().toUpperCase().replace(/[^A-Z]/g, '')
  if (name.length >= 2) {
    return name.slice(0, 2) + name.slice(-2)
  } else if (name.length === 1) {
    return name + name + name + name // A -> AAAA
  }
  return 'XXXX'
}

export function generateUniquePrefix(basePrefix: string, existingPrefixes: string[]): string {
  if (!existingPrefixes.includes(basePrefix)) {
    return basePrefix
  }

  // Sequence: A, B, ... Z, AA, AB, ...
  // We can treat this as base-26 counting.

  let i = 0
  while (true) {
    const suffix = generateSuffix(i)
    const candidate = `${basePrefix}-${suffix}`
    if (!existingPrefixes.includes(candidate)) {
      return candidate
    }
    i++
  }
}

function generateSuffix(index: number): string {
  // 0 -> A, 25 -> Z, 26 -> AA, 27 -> AB...
  let suffix = ''
  let num = index

  do {
    const remainder = num % 26
    suffix = String.fromCharCode(65 + remainder) + suffix
    num = Math.floor(num / 26) - 1
  } while (num >= 0)

  return suffix
}

export function formatCurrency(cents: number): string {
  return `£${(cents / 100).toFixed(2)}`
}
