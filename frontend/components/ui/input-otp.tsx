"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface InputOTPProps extends React.InputHTMLAttributes<HTMLInputElement> {
  length?: number
  onComplete?: (value: string) => void
}

const InputOTP = React.forwardRef<HTMLInputElement, InputOTPProps>(
  ({ className, length = 6, onComplete, ...props }, ref) => {
    const [values, setValues] = React.useState<string[]>(Array(length).fill(""))
    const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null)
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

    const handleInputChange = (index: number, value: string) => {
      if (value.length > 1) return

      const newValues = [...values]
      newValues[index] = value
      setValues(newValues)

      // Auto-focus next input
      if (value && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }

      // Call onComplete when all fields are filled
      if (newValues.every((v) => v !== "") && onComplete) {
        onComplete(newValues.join(""))
      }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !values[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }

    return (
      <div className="flex justify-center gap-3">
        {values.map((value, index) => (
          <div key={index} className="relative">
            <input
              ref={(el) => {
                inputRefs.current[index] = el
                if (index === 0 && ref) {
                  if (typeof ref === "function") {
                    ref(el)
                  } else {
                    ref.current = el
                  }
                }
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={value}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              className={cn(
                "w-12 h-12 text-center text-lg font-semibold border-2 transition-all duration-200 rounded-xl",
                focusedIndex === index
                  ? "border-blue-500 focus:ring-4 focus:ring-blue-100"
                  : "border-gray-200 hover:border-gray-300",
                className,
              )}
              {...props}
            />
            {focusedIndex === index && (
              <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none animate-pulse"></div>
            )}
          </div>
        ))}
      </div>
    )
  },
)

InputOTP.displayName = "InputOTP"
export { InputOTP }
