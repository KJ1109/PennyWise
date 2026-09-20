import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })
    
    // Prevent browsers from caching pages (solves the back-button-after-logout issue)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, {
                            ...options,
                            // Disable secure in dev to support LAN (http://192.168.x.x)
                            secure: process.env.NODE_ENV === 'production',
                        })
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname

    // 1. Protected Routes: Dashboard, Settings, etc.
    // Assuming everything is protected except auth routes, public landing, etc.
    // Actually, usually '/' is the dashboard.

    const isAuthRoute = path.startsWith('/auth') || path === '/login'
    // '/' is the landing page - public for all users
    const isPublicRoute = path === '/' || path === '/auth/auth-code-error'

    if (!user && !isAuthRoute && !isPublicRoute) {
        // Redirect unauthenticated users to login
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    if (user && path === '/login') {
        // Redirect authenticated users away from login to dashboard
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // Note: Onboarding protection depends on profile data which requires DB access.
    // Middleware should ideally avoid DB calls to 'profiles'. 
    // We will leave 'Onboarding vs Dashboard' routing to the Layout/Page level (Client or Server Component).

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|glb)$).*)',
    ],
}
