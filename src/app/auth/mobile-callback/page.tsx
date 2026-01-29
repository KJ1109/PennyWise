'use client'

import { useEffect } from 'react'

export default function MobileCallback() {
    useEffect(() => {
        // This page is a BRIDGE.
        // It receives the Auth Callback from Supabase (on HTTPS)
        // And immediately throws it over the wall to the Native App (Custom Scheme)

        // We must forward BOTH the 'search' (?code=...) and 'hash' (#access_token=...)
        // to ensure we cover both PKCE and Implicit flows.
        const search = window.location.search
        const hash = window.location.hash

        // Redirect to the App
        window.location.href = `com.pennywise.app://auth${search}${hash}`
    }, [])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-gray-400">Finalizing login...</p>
            <p className="text-xs text-gray-600 mt-2">Opening App...</p>
        </div>
    )
}
