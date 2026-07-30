import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const loginName = headersList.get('x-user-id') || 'guest';
    
    const { appId } = await req.json();
    if (!appId) {
      return NextResponse.json({ error: 'appId is required' }, { status: 400 });
    }

    // Extract client IP and user agent
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';
    const userAgent = headersList.get('user-agent') || 'Unknown';

    const log = await prisma.accessLog.create({
      data: {
        loginName,
        appId,
        ip: ip.split(',')[0].trim(),
        userAgent,
      }
    });

    return NextResponse.json(log);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
