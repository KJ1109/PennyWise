import { createClient } from '@/lib/supabase/client'

/**
 * Completely resets the application state.
 * Use this on Logout, Account Deletion, or when detecting a stale session.
 * 
 * Clears:
 * 1. Supabase Session (via signOut)
 * 2. LocalStorage (All keys)
 * 3. SessionStorage (All keys)
 * 4. Document Cookies (Aggressive wipe)
 * 5. Capacitor WebView Cache (Indirectly via href reload)
 */
export async function clearApplicationData(keepSession = false) {
    console.log('[AppReset] Starting cleanup...', { keepSession })

    try {
        // 1. Supabase SignOut (Only if not keeping session)
        if (!keepSession) {
            const supabase = createClient()
            await supabase.auth.signOut()
        }
    } catch (e) {
        console.warn('[AppReset] Supabase signOut failed:', e)
    }

    // 2. Clear Browser Storage
    // This is critical for Capacitor WebView which persists localStorage
    localStorage.clear()
    sessionStorage.clear()

    // 3. Clear Cookies (Aggressive) - Only if not keeping session
    // If we keep session, we need the Auth Cookie for SSR
    if (!keepSession) {
        const cookies = document.cookie.split(";")
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i]
            const eqPos = cookie.indexOf("=")
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname
        }
    }

    console.log('[AppReset] Local state wiped.')

    // 4. Reload/Redirect
    // If not keeping session -> Login
    // If keeping session -> Caller handles redirect (e.g., to onboarding)
    if (!keepSession && window.location.pathname !== '/login') {
        window.location.href = '/login'
    }
}
