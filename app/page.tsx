// app/page.tsx
import { headers } from 'next/headers';
import Dashboard from './Dashboard';
import { prisma } from '../lib/prisma';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id') || 'guest';

  const apps = await prisma.app.findMany({
    orderBy: {
      sortOrder: 'asc',
    },
  });

  return <Dashboard userId={userId} initialApps={apps} />;
}
