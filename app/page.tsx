import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Dashboard from './Dashboard';
import { prisma } from '../lib/prisma';
import { checkAdmin } from '../lib/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "建安万维 数字化工作台门户 - 统一数字化应用安全管理平台",
  description: "建安万维 数字化工作台门户提供企业级子系统单点登录（SSO）安全托管、动态应用分类过滤、健康探活监控与维护模式降级管理。",
  icons: {
    icon: '/logo_zpje.jpg',
  }
};

export default async function Page() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id') || 'guest';
  const isAdmin = await checkAdmin();

  // Fetch detailed user info and favorites if logged in
  let currentUserInfo = null;
  let favoriteAppIds: string[] = [];
  let userRoleKeys: string[] = [];
  let userDeptId: string | null = null;

  if (userId !== 'guest') {
    const member = await prisma.member.findUnique({
      where: { loginName: userId },
      include: {
        unit: {
          select: { name: true }
        },
        department: {
          select: { id: true, name: true }
        },
        roles: {
          include: {
            role: {
              select: { key: true }
            }
          }
        }
      }
    });
    if (member) {
      currentUserInfo = {
        name: member.name,
        loginName: member.loginName,
        unitName: member.unit?.name || '未知单位',
        deptName: member.department?.name || '未知部门',
      };
      userDeptId = member.department?.id || null;
      userRoleKeys = member.roles.map(r => r.role.key);
    }

    if (isAdmin || userId === 'admin' || userId === 'OmniRest') {
      userRoleKeys.push('admin');
    }

    const favorites = await prisma.userFavorite.findMany({
      where: { loginName: userId },
      select: { appId: true }
    });
    favoriteAppIds = favorites.map(f => f.appId);
  }

  // Fetch all apps with their associated permissions & mainDept details
  const apps = await prisma.app.findMany({
    include: {
      mainDept: {
        select: {
          id: true,
          name: true,
        }
      },
      rolePermissions: {
        select: {
          role: {
            select: { key: true }
          }
        }
      },
      deptPermissions: {
        select: {
          departmentId: true
        }
      }
    },
    orderBy: {
      sortOrder: 'asc',
    },
  });

  // Filter apps based on RBAC visibility:
  // - Admin sees everything.
  // - App is visible if app.visibleToAll is true.
  // - App is visible if user has an allowed role (app.rolePermissions matches userRoleKeys).
  // - App is visible if user department matches an allowed department (app.deptPermissions matches userDeptId).
  const filteredApps = apps.filter(app => {
    if (isAdmin || userId === 'admin' || userId === 'OmniRest') return true; // Admin bypass
    if (app.visibleToAll) return true; // Public access
    
    // Check roles
    const hasAllowedRole = app.rolePermissions.some(rp => userRoleKeys.includes(rp.role.key));
    if (hasAllowedRole) return true;

    // Check department
    if (userDeptId) {
      const hasAllowedDept = app.deptPermissions.some(dp => dp.departmentId === userDeptId);
      if (hasAllowedDept) return true;
    }

    return false;
  });

  // Fetch only departments that have at least one of the visible apps registered
  const visibleAppDeptIds = filteredApps
    .map(a => a.mainDeptId)
    .filter((id): id is string => id !== null);

  const departments = await prisma.department.findMany({
    where: {
      id: {
        in: visibleAppDeptIds
      }
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    }
  });

  // Fetch homepage widgets
  const widgets = await prisma.widget.findMany({
    orderBy: {
      sortOrder: 'asc'
    }
  });

  // Serialize models safely for client
  const serializedApps = filteredApps.map((app) => ({
    id: app.id,
    key: app.key,
    name: app.name,
    description: app.description,
    url: app.url,
    icon: app.icon,
    color: app.color,
    isMaintenance: app.isMaintenance,
    healthStatus: app.healthStatus,
    mainDeptId: app.mainDeptId,
    mainDept: app.mainDept ? { id: app.mainDept.id, name: app.mainDept.name } : null,
  }));

  const serializedWidgets = widgets.map((widget) => ({
    id: widget.id,
    title: widget.title,
    appId: widget.appId,
    type: widget.type,
    url: widget.url,
    widthClass: widget.widthClass,
    sortOrder: widget.sortOrder
  }));

  return (
    <Dashboard 
      userId={userId} 
      initialApps={serializedApps} 
      departments={departments}
      isAdmin={isAdmin}
      userInfo={currentUserInfo}
      initialFavoriteIds={favoriteAppIds}
      widgets={serializedWidgets}
    />
  );
}
