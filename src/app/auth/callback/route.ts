import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            // Force a session check to ensure cookies are set before redirect
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
        // Redirect with error message if exchange failed
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error?.message || 'Unknown Error')}`)
    }

    // Default error if no code
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=Missing%20Auth%20Code`)
}
