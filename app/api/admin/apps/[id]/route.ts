import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      key,
      name,
      description,
      url,
      icon,
      category,
      isMaintenance,
      sortOrder,
      mainDeptId,
    } = body;

    // Check if app exists
    const app = await prisma.app.findUnique({
      where: { id }
    });
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // If key is changed, make sure it is not taken
    if (key && key !== app.key) {
      const existing = await prisma.app.findUnique({
        where: { key }
      });
      if (existing) {
        return NextResponse.json({ error: 'Application key already exists' }, { status: 400 });
      }
    }

    const updatedApp = await prisma.app.update({
      where: { id },
      data: {
        key: key !== undefined ? key : app.key,
        name: name !== undefined ? name : app.name,
        description: description !== undefined ? description : app.description,
        url: url !== undefined ? url : app.url,
        icon: icon !== undefined ? icon : app.icon,
        category: category !== undefined ? category : app.category,
        isMaintenance: isMaintenance !== undefined ? !!isMaintenance : app.isMaintenance,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : app.sortOrder,
        mainDeptId: mainDeptId !== undefined ? (mainDeptId || null) : app.mainDeptId,
      },
    });

    return NextResponse.json(updatedApp);
  } catch (err: any) {
    console.error(`Failed to update app ${id}:`, err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const app = await prisma.app.findUnique({
      where: { id }
    });
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    await prisma.app.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`Failed to delete app ${id}:`, err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
