'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function MobileCallback() {
    const searchParams = useSearchParams()
    const router = useRouter()

    useEffect(() => {
        // This page acts as a bridge. It receives the OAuth code/token from the provider
        // and immediately redirects back to the Mobile App using the Custom Scheme.

        const params = new URLSearchParams(searchParams.toString())
        const code = params.get('code')
        const error = params.get('error')
        const hash = window.location.hash

        // Construct the Deep Link URL
        // Scheme: com.pennywise.app://
        // Path: google-auth
        // Params: Forward everything

        let deepLink = `com.pennywise.app://google-auth?${params.toString()}`
        if (hash) {
            deepLink += hash
        }

        console.log('Redirecting to Deep Link:', deepLink)

        // Force redirect to the app
        window.location.href = deepLink

        // Fallback: If app doesn't open (e.g. user is on desktop testing this route),
        // show a message or redirect to home.
        const timer = setTimeout(() => {
            // Optional: Redirect to home or show "Open in App" button
        }, 3000)

        return () => clearTimeout(timer)
    }, [searchParams])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4 text-center">
            <h1 className="text-xl font-bold mb-4">Redirecting to PennyWise...</h1>
            <p className="text-gray-400 text-sm">
                If the app doesn't open automatically, <a href="#" onClick={(e) => {
                    e.preventDefault()
                    const params = new URLSearchParams(window.location.search)
                    window.location.href = `com.pennywise.app://google-auth?${params.toString()}${window.location.hash}`
                }} className="text-[#00C896] underline">click here</a>.
            </p>
        </div>
    )
}
