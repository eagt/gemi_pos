'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface PinInputProps {
    length?: number
    onComplete: (pin: string) => void
    onClear?: () => void
    error?: boolean
    disabled?: boolean
    className?: string
}

export function PinInput({
    length = 4,
    onComplete,
    onClear,
    error = false,
    disabled = false,
    className,
}: PinInputProps) {
    const [pin, setPin] = useState<string[]>(Array(length).fill(''))
    const [activeIndex, setActiveIndex] = useState(0)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    useEffect(() => {
        // Focus first input on mount
        inputRefs.current[0]?.focus()
    }, [])

    useEffect(() => {
        // Clear PIN when error occurs
        if (error) {
            setPin(Array(length).fill(''))
            setActiveIndex(0)
            inputRefs.current[0]?.focus()
            onClear?.()
        }
    }, [error, length, onClear])

    const handleChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) {
            return
        }

        const newPin = [...pin]
        newPin[index] = value

        setPin(newPin)

        // Move to next input
        if (value && index < length - 1) {
            setActiveIndex(index + 1)
            inputRefs.current[index + 1]?.focus()
        }

        // Check if PIN is complete
        if (newPin.every((digit) => digit !== '')) {
            onComplete(newPin.join(''))
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            e.preventDefault()

            if (pin[index]) {
                // Clear current digit
                const newPin = [...pin]
                newPin[index] = ''
                setPin(newPin)
            } else if (index > 0) {
                // Move to previous input and clear it
                const newPin = [...pin]
                newPin[index - 1] = ''
                setPin(newPin)
                setActiveIndex(index - 1)
                inputRefs.current[index - 1]?.focus()
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            setActiveIndex(index - 1)
            inputRefs.current[index - 1]?.focus()
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            setActiveIndex(index + 1)
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text/plain').slice(0, length)

        if (!/^\d+$/.test(pastedData)) {
            return
        }

        const newPin = Array(length).fill('')
        pastedData.split('').forEach((digit, index) => {
            if (index < length) {
                newPin[index] = digit
            }
        })

        setPin(newPin)

        const lastFilledIndex = Math.min(pastedData.length, length) - 1
        setActiveIndex(lastFilledIndex)
        inputRefs.current[lastFilledIndex]?.focus()

        if (newPin.every((digit) => digit !== '')) {
            onComplete(newPin.join(''))
        }
    }

    return (
        <div className={cn('flex gap-3 justify-center', className)}>
            {pin.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => {
                        inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    onFocus={() => setActiveIndex(index)}
                    disabled={disabled}
                    className={cn(
                        'w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all',
                        'focus:outline-none focus:ring-2 focus:ring-offset-2',
                        error
                            ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-500'
                            : activeIndex === index
                                ? 'border-purple-500 bg-white focus:ring-purple-500'
                                : 'border-gray-300 bg-white focus:ring-purple-500',
                        disabled && 'opacity-50 cursor-not-allowed',
                        digit && !error && 'border-purple-500 bg-purple-50'
                    )}
                />
            ))}
        </div>
    )
}
