import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowser() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
        throw new Error('Supabase URL or Key is missing. Check your .env.local file and rebuild the app.')
    }

    return createBrowserClient(url, key)
}
// Legacy export for backward compatibility until refactor is complete
export const createClient = createSupabaseBrowser
