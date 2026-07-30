import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Dashboard from './Dashboard';
import { prisma } from '../lib/prisma';
import { checkAdmin } from '../lib/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "建安万维 数字化工作台门户 - 统一数字化应用安全管理平台",
  description: "建安万维 数字化工作台门户提供企业级子系统单点登录（SSO）安全托管、动态应用分类过滤、健康探活监控与维护模式降级管理。",
};

export default async function Page() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id') || 'guest';
  const isAdmin = await checkAdmin();

  // Fetch detailed user info and favorites if logged in
  let currentUserInfo = null;
  let favoriteAppIds: string[] = [];
  if (userId !== 'guest') {
    const member = await prisma.member.findUnique({
      where: { loginName: userId },
      include: {
        unit: {
          select: { name: true }
        },
        department: {
          select: { name: true }
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
    }

    const favorites = await prisma.userFavorite.findMany({
      where: { loginName: userId },
      select: { appId: true }
    });
    favoriteAppIds = favorites.map(f => f.appId);
  }

  // Fetch all apps with their associated mainDept details
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

  // Fetch only departments that have at least one app registered
  const departments = await prisma.department.findMany({
    where: {
      apps: {
        some: {}
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

  // Serialize models safely for client
  const serializedApps = apps.map((app) => ({
    id: app.id,
    key: app.key,
    name: app.name,
    description: app.description,
    url: app.url,
    icon: app.icon,
    category: app.category,
    isMaintenance: app.isMaintenance,
    healthStatus: app.healthStatus,
    mainDeptId: app.mainDeptId,
    mainDept: app.mainDept ? { id: app.mainDept.id, name: app.mainDept.name } : null,
  }));

  return (
    <Dashboard 
      userId={userId} 
      initialApps={serializedApps} 
      departments={departments}
      isAdmin={isAdmin}
      userInfo={currentUserInfo}
      initialFavoriteIds={favoriteAppIds}
    />
  );
}

