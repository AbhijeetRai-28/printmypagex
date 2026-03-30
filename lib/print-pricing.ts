export type PrintType = "bw" | "color" | "glossy"
export const SPIRAL_BINDING_KEY = "spiralBinding" as const
export type ExtraPricingKey = typeof SPIRAL_BINDING_KEY
export type PricingKey = PrintType | ExtraPricingKey

export type PrintPricing = Record<PricingKey, number>

type PricingPlanContent = {
  title: string
  shortLabel: string
  description: string
  features: string[]
}

export const PRINT_TYPE_KEYS: PrintType[] = ["bw", "color", "glossy"]
export const PRICING_KEYS: PricingKey[] = [...PRINT_TYPE_KEYS, SPIRAL_BINDING_KEY]

export const DEFAULT_PRINT_PRICING: PrintPricing = {
  bw: 2,
  color: 5,
  glossy: 15,
  spiralBinding: 30
}

export const PRINT_TYPE_CONTENT: Record<PrintType, PricingPlanContent> = {
  bw: {
    title: "Black & White",
    shortLabel: "Black & White",
    description: "Standard document printing",
    features: ["A4 printing", "Clear text quality", "Fast processing"]
  },
  color: {
    title: "Color Print",
    shortLabel: "Color",
    description: "High quality color prints",
    features: ["Color graphics", "Charts & diagrams", "Project reports"]
  },
  glossy: {
    title: "Glossy Print",
    shortLabel: "Glossy",
    description: "Premium glossy printing",
    features: ["Photos", "Posters", "Presentation covers","Official Documents"]
  }
}

export const EXTRA_PRICING_CONTENT: Record<
  ExtraPricingKey,
  PricingPlanContent & {
    priceUnitLabel: string
  }
> = {
  spiralBinding: {
    title: "Spiral Binding",
    shortLabel: "Spiral Binding",
    description: "Add spiral binding for compiled documents",
    priceUnitLabel: "₹ / order",
    features: ["Fixed per order charge", "Useful for reports and projects"]
  }
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

export function normalizeCopies(copies: unknown) {
  const parsed = Number(copies)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

export function normalizePrintPricing(
  raw: Partial<Record<PricingKey, unknown>> | null | undefined
): PrintPricing {
  return PRICING_KEYS.reduce((acc, key) => {
    const parsed = Number(raw?.[key])
    acc[key] = Number.isFinite(parsed) && parsed > 0 ? round2(parsed) : DEFAULT_PRINT_PRICING[key]
    return acc
  }, { ...DEFAULT_PRINT_PRICING })
}

export function parsePrintPricingInput(
  raw: Partial<Record<PricingKey, unknown>> | null | undefined
): { pricing: PrintPricing | null; error: string | null } {
  const nextPricing = {} as PrintPricing

  for (const key of PRICING_KEYS) {
    const parsed = Number(raw?.[key])
    const title =
      key === SPIRAL_BINDING_KEY
        ? EXTRA_PRICING_CONTENT[key].title
        : PRINT_TYPE_CONTENT[key].title

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return {
        pricing: null,
        error: `${title} price must be greater than 0`
      }
    }

    nextPricing[key] = round2(parsed)
  }

  return {
    pricing: nextPricing,
    error: null
  }
}

export function getPriceForPrintType(
  printType: unknown,
  pricing: PrintPricing = DEFAULT_PRINT_PRICING
) {
  if (printType === "color" || printType === "glossy" || printType === "bw") {
    return pricing[printType]
  }

  return pricing.bw
}

export function calculatePrintPrice(
  pages: number,
  printType: unknown,
  pricing: PrintPricing = DEFAULT_PRINT_PRICING,
  copies: unknown = 1
) {
  if (!Number.isFinite(pages) || pages <= 0) {
    return 0
  }

  return round2(pages * normalizeCopies(copies) * getPriceForPrintType(printType, pricing))
}

export function getSpiralBindingPrice(pricing: PrintPricing = DEFAULT_PRINT_PRICING) {
  return round2(pricing.spiralBinding)
}

export function getTotalPrintablePages(pages: number, copies: unknown = 1) {
  if (!Number.isFinite(pages) || pages <= 0) {
    return 0
  }

  return Math.round(pages * normalizeCopies(copies))
}

export function calculateOrderPrice(
  pages: number,
  printType: unknown,
  pricing: PrintPricing = DEFAULT_PRINT_PRICING,
  options?: {
    spiralBinding?: boolean
    copies?: number
  }
) {
  const printPrice = calculatePrintPrice(pages, printType, pricing, options?.copies)
  const bindingPrice = options?.spiralBinding ? getSpiralBindingPrice(pricing) : 0

  return round2(printPrice + bindingPrice)
}

export function formatPricePerPage(price: number) {
  return `₹${round2(price)} / page`
}

export function formatPricePerOrder(price: number) {
  return `₹${round2(price)} / order`
}

export function getPricingPlans(pricing: PrintPricing) {
  return PRINT_TYPE_KEYS.map((key) => ({
    key,
    ...PRINT_TYPE_CONTENT[key],
    price: pricing[key],
    priceLabel: formatPricePerPage(pricing[key])
  }))
}
