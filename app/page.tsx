// app/page.tsx
import { headers } from 'next/headers';
import Dashboard from './Dashboard';
import { prisma } from '../lib/prisma';
import { checkAdmin } from '../lib/auth';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id') || 'guest';
  const isAdmin = await checkAdmin();

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
    />
  );
}

