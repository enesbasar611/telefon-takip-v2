import * as React from "react"

import { cn } from "@/lib/utils"

const moneyFieldPattern = /(amount|price|balance|limit|paid|payment|cost|total|discount|debt|cash|card|fee|commission|expense|income|unitprice|purchaseprice|saleprice|finalprice)/i

const parseMoneyValue = (value: string) => {
  const compact = value.trim().replace(/\s/g, "")
  const hasComma = compact.includes(",")
  const dotCount = (compact.match(/\./g) || []).length
  const normalized = hasComma
    ? compact.replace(/\./g, "").replace(",", ".")
    : dotCount > 1
      ? compact.replace(/\.(?=.*\.)/g, "")
      : compact
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const normalizeMoneyValue = (value: string) => {
  if (!value.trim()) return "0"
  const amount = parseMoneyValue(value)
  return Number.isInteger(amount) ? String(amount) : String(amount)
}

const setInputValue = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onFocus, onBlur, inputMode, step, name, id, ...props }, ref) => {
    const fieldKey = `${name || ""} ${id || ""}`
    const isMoneyInput = type === "number" && (step === "0.01" || moneyFieldPattern.test(fieldKey))
    const resolvedType = isMoneyInput ? "text" : type
    const resolvedInputMode = isMoneyInput ? "decimal" : inputMode

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      onFocus?.(event)
      if (event.defaultPrevented || !isMoneyInput) return

      const amount = parseMoneyValue(event.currentTarget.value)
      if (amount === 0) {
        setInputValue(event.currentTarget, "")
        return
      }
      event.currentTarget.select()
    }

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(event)
      if (event.defaultPrevented || !isMoneyInput || onBlur) return

      const normalized = normalizeMoneyValue(event.currentTarget.value)
      if (event.currentTarget.value !== normalized) {
        setInputValue(event.currentTarget, normalized)
      }
    }

    return (
      <input
        type={resolvedType}
        inputMode={resolvedInputMode}
        step={isMoneyInput ? undefined : step}
        name={name}
        id={id}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          "flex h-12 w-full rounded-xl border border-input bg-card px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }



