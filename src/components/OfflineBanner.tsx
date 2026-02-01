'use client'

import { WifiOff } from 'lucide-react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

export function OfflineBanner() {
    const isOnline = useNetworkStatus()
    console.log('OfflineBanner Render:', { isOnline })

    if (isOnline) return null

    return (
        <div className="fixed bottom-16 left-4 right-4 z-[9999] animate-in slide-in-from-bottom-5 md:bottom-4 md:left-auto md:w-auto">
            <div className="flex items-center gap-3 rounded-lg bg-yellow-600 px-4 py-3 text-white shadow-lg">
                <WifiOff className="h-5 w-5" />
                <div className="flex flex-col">
                    <span className="text-sm font-semibold">You are offline</span>
                    <span className="text-xs opacity-90">Changes cannot be saved.</span>
                </div>
            </div>
        </div>
    )
}
