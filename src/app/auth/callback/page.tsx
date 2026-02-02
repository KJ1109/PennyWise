'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function AuthCallback() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [error, setError] = useState<string | null>(null)

    const hasRun = useRef(false)

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code')
            const next = searchParams.get('next') ?? '/'

            if (code) {
                if (hasRun.current) return
                hasRun.current = true

                const supabase = createSupabaseBrowser()
                const { error: sessionError, data: { user } } = await supabase.auth.exchangeCodeForSession(code)

                if (sessionError) {
                    setError(sessionError.message)
                    return
                }

                if (user) {
                    // [AUTO-HEAL] Client-Side Check
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('id', user.id)
                        .maybeSingle()

                    if (!profile) {
                        const { full_name, avatar_url, name } = user.user_metadata || {}
                        const displayName = full_name || name || user.email?.split('@')[0] || 'User'

                        await supabase.from('profiles').upsert({
                            id: user.id,
                            email: user.email,
                            full_name: displayName,
                            avatar_url: avatar_url,
                            updated_at: new Date().toISOString()
                        })
                    }
                }

                router.push(next)
                router.refresh()
            } else {
                router.push('/auth/auth-code-error')
            }
        }

        handleCallback()
    }, [searchParams, router])

    if (error) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4">
                <div className="text-red-500 mb-4 font-bold">Authentication Error</div>
                <div className="text-sm text-gray-400">{error}</div>
                <button onClick={() => router.push('/login')} className="mt-6 text-[#00C896] hover:underline">
                    Back to Login
                </button>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
            <Loader2 className="h-8 w-8 animate-spin text-[#00C896] mb-4" />
            <p className="text-gray-400 text-sm">Finishing sign in...</p>
        </div>
    )
}
