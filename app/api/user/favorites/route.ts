import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const loginName = headersList.get('x-user-id');
    if (!loginName || loginName === 'guest') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { appId } = await req.json();
    if (!appId) {
      return NextResponse.json({ error: 'appId is required' }, { status: 400 });
    }

    const favorite = await prisma.userFavorite.upsert({
      where: {
        loginName_appId: { loginName, appId }
      },
      create: { loginName, appId },
      update: {}
    });

    return NextResponse.json(favorite);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const headersList = await headers();
    const loginName = headersList.get('x-user-id');
    if (!loginName || loginName === 'guest') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check query params first
    const { searchParams } = new URL(req.url);
    let appId = searchParams.get('appId');

    // Check body if not in query params
    if (!appId) {
      try {
        const body = await req.json();
        appId = body.appId;
      } catch (_) {}
    }

    if (!appId) {
      return NextResponse.json({ error: 'appId is required' }, { status: 400 });
    }

    await prisma.userFavorite.deleteMany({
      where: { loginName, appId }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
