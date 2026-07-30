import React from 'react';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/auth';
import AdminAppRegistry from './AdminAppRegistry';
import { ShieldAlert, Home } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const isAdmin = await checkAdmin();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6 text-text-main font-sans">
        <div className="w-full max-w-md p-8 bg-card-surface rounded-lg border border-card-border shadow-md text-center flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold tracking-tight text-title">访问被拒绝</h1>
            <p className="text-sm text-text-sec leading-relaxed">
              您的账户没有管理员权限，无法访问应用注册中心。如有疑问，请联系系统管理员进行授权。
            </p>
          </div>
          <a
            href="/"
            className="w-full py-2.5 rounded-full border border-input-border bg-card-surface hover:bg-sidebar-hover transition-all font-semibold text-sm flex items-center justify-center gap-2 text-title"
          >
            <Home className="w-4 h-4" />
            <span>返回门户首页</span>
          </a>
        </div>
      </div>
    );
  }

  // Fetch initial apps and departments tree
  const apps = await prisma.app.findMany({
    include: {
      mainDept: {
        select: {
          id: true,
          name: true,
        }
      }
    },
    orderBy: {
      sortOrder: 'asc',
    },
  });

  const units = await prisma.unit.findMany({
    include: {
      departments: {
        select: {
          id: true,
          name: true,
          parentId: true,
        },
        orderBy: {
          name: 'asc'
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  // Map Decimal or other custom fields to string if any, but our schema types are simple strings and numbers
  const serializedApps = apps.map((app) => ({
    ...app,
    description: app.description || null,
    icon: app.icon || null,
    mainDeptId: app.mainDeptId || null,
    mainDept: app.mainDept ? { id: app.mainDept.id, name: app.mainDept.name } : null,
  }));

  const serializedUnits = units.map((unit) => ({
    id: unit.id,
    name: unit.name,
    departments: unit.departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
    })),
  }));

  return (
    <AdminAppRegistry 
      initialApps={serializedApps} 
      departmentsTree={serializedUnits} 
    />
  );
}
