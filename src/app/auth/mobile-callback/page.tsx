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
        // The Mobile App will handle the Session Exchange internally or via deep link listener.
        // Note: New User triggering might fail here if the Mobile App doesn't call an endpoint to create profile.
        // HACK: We can't easily upsert profile here because we don't have the Session Cookie (it's in the hash/code).
        // The Mobile App must handle "Onboarding" redirection itself.
        window.location.href = `com.pennywise.app://auth${search}${hash}`
    }, [])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-gray-400">Finalizing login...</p>
            <p className="text-xs text-gray-600 mt-2">Opening App...</p>

            <button
                onClick={() => {
                    const search = window.location.search
                    const hash = window.location.hash
                    window.location.href = `com.pennywise.app://auth${search}${hash}`
                }}
                className="mt-8 rounded-full bg-white/10 px-6 py-2 text-sm font-medium text-white hover:bg-white/20"
            >
                Click here if App doesn't open
            </button>
        </div>
    )
}
