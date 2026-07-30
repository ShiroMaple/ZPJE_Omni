// docs/child-app-middleware-template.ts
/**
 * OMNI SSO Integration Template for Child Applications
 * Compatible with Next.js 12-15 (Middleware convention) and Next.js 16+ (Proxy convention)
 * 
 * Instructions:
 * 1. Determine your Next.js major version:
 *    - For Next.js 12 - 15: Save this file as `middleware.ts` in your project root.
 *    - For Next.js 16+: Save this file as `proxy.ts` in your project root.
 * 2. Ensure `jose` is installed in your child application: `pnpm add jose` or `npm install jose`.
 * 3. Configure the environment variables:
 *    - `SHARED_JWT_SECRET`: Must match the exact key configured in the Omni Portal.
 *    - `OMNI_PORTAL_URL`: The domain of the Omni Portal (defaults to https://omni.izpje.com).
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Implementation logic shared by both middleware and proxy conventions
async function verifyAndHandleRequest(request: NextRequest) {
  const tokenCookie = request.cookies.get('token');
  const portalUrl = process.env.OMNI_PORTAL_URL || 'https://omni.izpje.com';

  if (!tokenCookie?.value) {
    console.warn('SSO token cookie not found. Redirecting to Omni portal for login.');
    return NextResponse.redirect(new URL(portalUrl, request.url));
  }

  try {
    const secretKey = process.env.SHARED_JWT_SECRET;
    if (!secretKey || secretKey.length < 32) {
      console.error('SHARED_JWT_SECRET is missing or too short in child app.');
      // Proceed to login portal due to configuration error
      return NextResponse.redirect(new URL(portalUrl, request.url));
    }

    const secret = new TextEncoder().encode(secretKey);
    
    // Verify the JWT token signature and expiration
    const { payload } = await jwtVerify(tokenCookie.value, secret, {
      issuer: 'omni',
    });

    // Check if valid payload exists with loginName
    if (!payload || typeof payload.loginName !== 'string') {
      throw new Error('Invalid JWT payload contents.');
    }

    // Token is valid. Inject user info to headers for the child app to consume:
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.loginName);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (err) {
    console.warn('SSO JWT verification failed in child app. Redirecting to login. Error:', err);
    
    // Clear invalid token cookie and redirect back to Omni portal
    const response = NextResponse.redirect(new URL(portalUrl, request.url));
    response.cookies.delete('token');
    return response;
  }
}

// Next.js 16+ Proxy convention
export async function proxy(request: NextRequest) {
  return verifyAndHandleRequest(request);
}

// Next.js 12-15 Middleware convention (fallback for older Next.js projects)
export async function middleware(request: NextRequest) {
  return verifyAndHandleRequest(request);
}

// Config matchers to protect all routes except static assets
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (files with extensions)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\..*$).*)',
  ],
};
