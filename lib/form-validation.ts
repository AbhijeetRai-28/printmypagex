export function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

export function isNumeric(value: string) {
  return /^\d+$/.test(value)
}

export function isAlphabeticText(value: string) {
  return /^[A-Za-z ]+$/.test(value)
}

export function isAlphanumericHyphenText(value: string) {
  return /^[A-Za-z0-9-]+$/.test(value)
}
