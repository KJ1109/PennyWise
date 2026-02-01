import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                name: 'sb-pennywise-auth',
                // domain: '', // Let browser handle domain
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
            },
        }
    )
}
