import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "better-auth/types";
import { NextResponse, type NextRequest } from "next/server";

// Define public routes that don't need authentication
const publicRoutes = ['/login', '/register', '/forgot-password'];

export default async function authMiddleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get session status first
    const { data: session } = await betterFetch<Session>(
        "/api/auth/get-session",
        {
            baseURL: request.nextUrl.origin,
            headers: {
                cookie: request.headers.get("cookie") || "",
            },
        },
    );

    // Check if current path is a public route
    const isPublicRoute = publicRoutes.some(route => pathname === route);

    // If authenticated and trying to access public routes (login, register, etc.)
    if (session && isPublicRoute) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // If not authenticated and trying to access protected routes
    if (!session && !isPublicRoute) {
        const redirectUrl = new URL("/login", request.url);
        redirectUrl.searchParams.set("return_to", pathname);
        return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
    ],
}