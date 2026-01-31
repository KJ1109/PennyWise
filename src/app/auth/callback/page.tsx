'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
    const router = useRouter()

    useEffect(() => {
        const handleAuthCallback = async () => {
            const params = new URLSearchParams(window.location.search)
            const code = params.get('code')
            const next = params.get('next') ?? '/'

            if (code) {
                const supabase = createClient()
                const { error } = await supabase.auth.exchangeCodeForSession(code)

                if (!error) {
                    router.replace(next)
                    router.refresh()
                } else {
                    router.replace(`/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
                }
            } else {
                router.replace('/login')
            }
        }

        handleAuthCallback()
    }, [router])

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-500">Verifying session...</span>
        </div>
    )
}
