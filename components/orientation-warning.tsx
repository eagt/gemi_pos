'use client'

import { Smartphone } from 'lucide-react'

export function OrientationWarning() {
    return (
        <>
            <style jsx global>{`
                .orientation-warning {
                    display: none;
                }
                @media screen and (orientation: landscape) and (max-height: 380px) and (max-width: 900px) {
                    .orientation-warning {
                        display: flex;
                    }
                }
            `}</style>
            <div className="orientation-warning fixed inset-0 z-[100] bg-gradient-to-br from-purple-600 to-pink-600 backdrop-blur-lg items-center justify-center p-8">
                <div className="text-center text-white space-y-6">
                    {/* Animated Rotate Icon */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <Smartphone className="h-20 w-20 animate-[spin_2s_ease-in-out_infinite]" />
                        </div>
                    </div>

                    {/* Main Message */}
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold">Rotate your device vertically to continue</h1>
                    </div>
                </div>
            </div>
        </>
    )
}
