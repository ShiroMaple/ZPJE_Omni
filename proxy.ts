// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function proxy(request: NextRequest) {
  const tokenCookie = request.cookies.get('token');
  let loginName = 'guest';

  // Attempt to parse and verify the JWT if present
  if (tokenCookie?.value) {
    try {
      const secretKey = process.env.SHARED_JWT_SECRET;
      if (secretKey && secretKey.length >= 32) {
        const secret = new TextEncoder().encode(secretKey);
        const { payload } = await jwtVerify(tokenCookie.value, secret, {
          issuer: 'omni',
        });

        if (payload && typeof payload.loginName === 'string') {
          loginName = payload.loginName;
        }
      } else {
        console.warn('SHARED_JWT_SECRET in proxy is either missing or too short.');
      }
    } catch (err) {
      // In case of expired/invalid tokens, user remains a guest.
      console.debug('Token verification failed, defaulting user to guest.', err);
    }
  }

  // Clone headers and inject the x-user-id header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', loginName);

  // Return response with injected headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Ensure proxy runs on all paths except static assets, media, and images
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api/sso|.*\\..*$).*)',
  ],
};
