import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/auth';
import { recordSystemLog } from '@/lib/audit';

export async function GET() {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const widgets = await prisma.widget.findMany({
      include: {
        app: {
          select: { id: true, name: true }
        }
      },
      orderBy: {
        sortOrder: 'asc'
      }
    });

    return NextResponse.json(widgets);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, appId, type, url, widthClass, sortOrder } = await req.json();
    if (!title || !type || !url) {
      return NextResponse.json({ error: 'title, type, and url are required' }, { status: 400 });
    }

    const widget = await prisma.widget.create({
      data: {
        title,
        appId: appId || null,
        type,
        url,
        widthClass: widthClass || 'col-span-1',
        sortOrder: sortOrder || 0
      }
    });

    const headersList = await headers();
    const operator = headersList.get('x-user-id') || 'unknown';
    await recordSystemLog(operator, 'WIDGET_MANAGE', `创建 Widget 看板: ${widget.title} (${widget.type})`);

    return NextResponse.json(widget);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
