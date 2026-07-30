// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  let ticket: string | null = null;
  const secretKey = process.env.SHARED_JWT_SECRET;

  if (token && secretKey) {
    try {
      const encoder = new TextEncoder();
      const secret = encoder.encode(secretKey);
      const { payload } = await jwtVerify(token, secret);
      ticket = (payload.ticket as string) || null;
      console.info(`Logout triggered for user: ${payload.loginName}, ticket: ${ticket}`);
    } catch (e) {
      console.error('Error verifying JWT during logout:', e);
    }
  }

  // 1. Delete the JWT cookie
  cookieStore.delete('token');

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
