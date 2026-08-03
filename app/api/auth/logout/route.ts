import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { recordSystemLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  let ticket: string | null = null;
  let loginName: string | null = null;
  const secretKey = process.env.SHARED_JWT_SECRET;

  if (token && secretKey) {
    try {
      const encoder = new TextEncoder();
      const secret = encoder.encode(secretKey);
      const { payload } = await jwtVerify(token, secret);
      ticket = (payload.ticket as string) || null;
      loginName = (payload.loginName as string) || null;
      console.info(`Logout triggered for user: ${loginName}, ticket: ${ticket}`);
      if (loginName) {
        await recordSystemLog(loginName, 'LOGOUT', '用户退出登录并清理会话');
      }
    } catch (e) {
      console.error('Error verifying JWT during logout:', e);
    }
  }

  const host = request.headers.get('host') || '';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
  const cookieDomain = isLocalhost ? undefined : (process.env.COOKIE_DOMAIN || '.izpje.com');

  // 1. Delete the JWT cookie & session_active cookie by setting maxAge to 0 with correct domain
  cookieStore.set('token', '', {
    domain: cookieDomain,
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
  });
  cookieStore.set('session_active', '', {
    domain: cookieDomain,
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: false,
  });

  // 2. If ticket exists, notify Seeyon OA in the background
  if (ticket) {
    const seeyonHost = process.env.SEEYON_OA_HOST || 'https://oa.izpje.com';
    const logoutNotifyUrl = `${seeyonHost}/seeyon/thirdparty.do?method=logoutNotify&ticket=${ticket}`;
    
    try {
      console.info(`Notifying Seeyon OA logout for ticket: ${ticket}...`);
      // Run the notify asynchronously (fire and forget on network call, but catch errors)
      fetch(logoutNotifyUrl, {
        method: 'GET',
        cache: 'no-store',
      }).catch((err) => {
        console.error('Asynchronous error notifying Seeyon OA logout:', err);
      });
    } catch (err) {
      console.error('Error initiating Seeyon OA logout notify:', err);
    }
  }

  return NextResponse.json({ success: true });
}
