'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ErrorContent() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
            <h1 className="mb-4 text-2xl font-bold text-red-600">Authentication Error</h1>

            {error && (
                <div className="mb-6 rounded bg-red-50 p-3 text-red-800 border border-red-200">
                    <p className="font-bold text-sm">Error Details:</p>
                    <p className="font-mono text-xs mt-1">{error}</p>
                </div>
            )}

            <p className="mb-6 text-gray-600">
                There was a problem signing you in.
            </p>
            <div className="rounded-lg bg-gray-100 p-4 text-left text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <p className="font-semibold">Possible causes:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>You are accessing via a Network IP (e.g., 192.168.x.x) but Supabase is configured for localhost only.</li>
                    <li>The Redirect URL is not whitelisted in your Supabase Auth settings.</li>
                    <li>Your browser blocked the authentication cookies (common in Brave/incognito).</li>
                </ul>
            </div>
            <Link href="/login" className="mt-8 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                Return to Login
            </Link>
        </div>
    )
}

export default function AuthCodeErrorPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ErrorContent />
        </Suspense>
    )
}
