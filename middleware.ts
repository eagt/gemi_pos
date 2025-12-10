import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    // Redirect old staff-login path to new path
    if (request.nextUrl.pathname.match(/^\/dashboard\/shops\/[^/]+\/staff-login/)) {
        const shopId = request.nextUrl.pathname.split('/')[3]
        const newUrl = new URL(`/staff-login/${shopId}`, request.url)
        // Preserve search params
        newUrl.search = request.nextUrl.search
        return NextResponse.redirect(newUrl)
    }

    // POS Gatekeeper: Ensure user has a valid staff session cookie
    if (request.nextUrl.pathname.match(/\/dashboard\/shops\/[^/]+\/pos/)) {
        const posSession = request.cookies.get('pos_staff_session')
        if (!posSession) {
            const shopId = request.nextUrl.pathname.split('/')[3]
            return NextResponse.redirect(new URL(`/staff-login/${shopId}`, request.url))
        }
    }

    return await updateSession(request)
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
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
