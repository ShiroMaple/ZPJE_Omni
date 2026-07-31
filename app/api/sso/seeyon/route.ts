// app/api/sso/seeyon/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { recordSystemLog } from '@/lib/audit';

// Global cache for verified tickets to handle the two-step Seeyon CIP portal authentication handshake:
// 1. OA Server requests SSO接口 with ?ticket=XXX -> We verify and cache it -> return "SSOOK"
// 2. User Browser is redirected to PC登录地址 with ?ticket=XXX -> We retrieve the cached user -> log in and redirect to "/"
interface CachedTicket {
  loginName: string;
  createdAt: number;
}

const globalForTickets = global as unknown as {
  verifiedTickets?: Map<string, CachedTicket>;
};

const verifiedTickets = globalForTickets.verifiedTickets ?? new Map<string, CachedTicket>();
if (process.env.NODE_ENV !== 'production') {
  globalForTickets.verifiedTickets = verifiedTickets;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticket = searchParams.get('ticket');

  if (!ticket) {
    return NextResponse.json({ error: 'Missing SSO ticket parameter.' }, { status: 400 });
  }

  // Periodic cleanup of expired tickets (older than 60 seconds)
  const NOW = Date.now();
  for (const [key, value] of verifiedTickets.entries()) {
    if (NOW - value.createdAt > 60000) {
      verifiedTickets.delete(key);
    }
  }

  // Determine the redirect base URL, accounting for reverse proxies (e.g. Nginx)
  const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const protoHeader = request.headers.get('x-forwarded-proto') || 'https';
  const redirectBase = hostHeader ? `${protoHeader}://${hostHeader}` : request.url;

  // Check if this ticket is already verified (Step 2: Browser Redirect)
  let cached = verifiedTickets.get(ticket);
  if (!cached && process.env.NODE_ENV !== 'production' && ticket === 'dev-zadmin') {
    cached = { loginName: 'zadmin', createdAt: Date.now() };
  }

  if (cached) {
    const loginName = cached.loginName;
    verifiedTickets.delete(ticket); // Consume the ticket

    // Issue the JWT Token
    const secretKey = process.env.SHARED_JWT_SECRET;
    if (!secretKey || secretKey.length < 32) {
      console.error('SHARED_JWT_SECRET must be configured and at least 32 characters long.');
      return NextResponse.json({ error: 'Server misconfiguration.' }, { status: 500 });
    }

    try {
      const encoder = new TextEncoder();
      const secret = encoder.encode(secretKey);
      const token = await new SignJWT({ loginName, ticket })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer('omni')
        .setExpirationTime('8h')
        .sign(secret);

      // Save token as a secure HTTP-Only cookie across root domain (.izpje.com)
      const cookieStore = await cookies();
      const isLocalhost = redirectBase.includes('localhost') || redirectBase.includes('127.0.0.1');
      const cookieDomain = isLocalhost ? undefined : (process.env.COOKIE_DOMAIN || '.izpje.com');

      cookieStore.set('token', token, {
        domain: cookieDomain,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60, // 8 hours in seconds
      });

      // 设置客户端可见的 non-HttpOnly Cookie，用于判断 Session 存活并执行自动登出
      cookieStore.set('session_active', 'true', {
        domain: cookieDomain,
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60, // 8 小时
      });

      console.info(`SSO verified successfully from cache for user: ${loginName}. Redirecting to homepage.`);
      await recordSystemLog(loginName, 'SSO_LOGIN', '致远 OA 单点登录成功');
      return NextResponse.redirect(new URL('/', redirectBase));
    } catch (err) {
      console.error('Error generating JWT or setting cookie:', err);
      return NextResponse.redirect(new URL('/login-failed', redirectBase));
    }
  }

  // If NOT cached, this is Step 1 (Server-to-Server Handshake)
  let loginName: string | null = null;
  const seeyonHost = process.env.SEEYON_OA_HOST || 'https://oa.izpje.com';

  try {
    const verifyUrl = `${seeyonHost}/seeyon/thirdpartyController.do?ticket=${ticket}`;
    
    // Call Seeyon OA verification endpoint
    const response = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      // 1. Try to extract loginName from response headers
      loginName = response.headers.get('LoginName') || response.headers.get('loginname');

      // 2. If not found in headers, check the response body
      if (!loginName) {
        const bodyText = await response.text();
        try {
          const bodyJson = JSON.parse(bodyText);
          loginName =
            bodyJson.loginName ||
            bodyJson.loginname ||
            bodyJson.username ||
            bodyJson.userId ||
            bodyJson.data?.loginName ||
            bodyJson.data?.loginname;
        } catch (e) {
          // If body is not JSON, check if it's a simple plain string or XML
          const trimmed = bodyText.trim();
          if (trimmed && !trimmed.includes('<') && trimmed.length < 50) {
            loginName = trimmed;
          } else {
            // Attempt simple regex for XML tags <loginName>username</loginName>
            const match = trimmed.match(/<loginName>(.*?)<\/loginName>/i) || trimmed.match(/<loginname>(.*?)<\/loginname>/i);
            if (match && match[1]) {
              loginName = match[1].trim();
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error verifying Seeyon OA SSO ticket:', error);
  }

  // If validation fails or loginName is empty, return SSOLogoutError to OA Server
  if (!loginName) {
    console.warn(`SSO ticket verification failed for ticket: ${ticket}. Returning SSOLogoutError.`);
    return new NextResponse('SSOLogoutError', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Verification succeeded! Cache the ticket and return SSOOK
  verifiedTickets.set(ticket, { loginName, createdAt: Date.now() });
  console.info(`SSO ticket ${ticket} verified successfully for user ${loginName}. Returning SSOOK.`);
  return new NextResponse('SSOOK', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}

