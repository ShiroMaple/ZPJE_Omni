import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/auth';
import { recordSystemLog } from '@/lib/audit';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { title, appId, type, url, widthClass, sortOrder } = await req.json();
    if (!title || !type || !url) {
      return NextResponse.json({ error: 'title, type, and url are required' }, { status: 400 });
    }

    const widget = await prisma.widget.update({
      where: { id },
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
    await recordSystemLog(operator, 'WIDGET_MANAGE', `更新 Widget 看板: ${widget.title} (${widget.type})`);

    return NextResponse.json(widget);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const widget = await prisma.widget.findUnique({
      where: { id }
    });
    if (!widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    await prisma.widget.delete({
      where: { id }
    });

    const headersList = await headers();
    const operator = headersList.get('x-user-id') || 'unknown';
    await recordSystemLog(operator, 'WIDGET_MANAGE', `删除 Widget 看板: ${widget.title} (${widget.type})`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
