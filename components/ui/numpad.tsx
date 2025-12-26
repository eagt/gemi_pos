'use client'

import { Delete } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NumpadProps {
    onNumberClick: (num: string) => void
    onBackspace: () => void
    className?: string
}

export function Numpad({ onNumberClick, onBackspace, className }: NumpadProps) {
    return (
        <div className={cn("grid grid-cols-3 gap-4 max-w-[320px] mx-auto", className)}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                    key={num}
                    type="button"
                    onClick={() => onNumberClick(num.toString())}
                    className="h-16 flex items-center justify-center text-2xl font-bold text-slate-700 bg-white rounded-2xl border-b-4 border-slate-200 hover:border-b-2 hover:translate-y-[2px] active:translate-y-[4px] active:border-b-0 transition-all shadow-sm hover:bg-slate-50"
                >
                    {num}
                </button>
            ))}
            <div className="invisible" />
            <button
                key={0}
                type="button"
                onClick={() => onNumberClick('0')}
                className="h-16 flex items-center justify-center text-2xl font-bold text-slate-700 bg-white rounded-2xl border-b-4 border-slate-200 hover:border-b-2 hover:translate-y-[2px] active:translate-y-[4px] active:border-b-0 transition-all shadow-sm hover:bg-slate-50"
            >
                0
            </button>
            <button
                type="button"
                onClick={onBackspace}
                className="h-16 flex items-center justify-center text-xl font-bold text-slate-500 bg-white rounded-2xl border-b-4 border-slate-200 hover:border-b-2 hover:translate-y-[2px] active:translate-y-[4px] active:border-b-0 transition-all shadow-sm hover:bg-slate-50"
            >
                <Delete className="w-6 h-6" />
            </button>
        </div>
    )
}
