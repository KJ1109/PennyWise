import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

export function createSupabaseBrowser() {
    if (client) return client

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
        throw new Error('Supabase URL or Key is missing. Check your .env.local file and rebuild the app.')
    }

    client = createBrowserClient(url, key)
    return client
}

// Legacy export for backward compatibility until refactor is complete
export const createClient = createSupabaseBrowser
