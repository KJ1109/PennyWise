import { createClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = createClient()
        const { error, data: { user } } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && user) {
            // [AUTO-HEAL] Create Profile Immediately if missing
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .single()

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

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
