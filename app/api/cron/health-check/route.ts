import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const cronToken = process.env.CRON_TOKEN || 'secure_cron_token';
  const token = request.headers.get('x-cron-token') || request.nextUrl.searchParams.get('token');

  if (token !== cronToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const apps = await prisma.app.findMany();
    
    const results = await Promise.all(
      apps.map(async (app) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const startTime = Date.now();

        try {
          // 发起探活请求，使用 GET 确保适配绝大多数子系统
          const res = await fetch(app.url, {
            method: 'GET',
            signal: controller.signal,
            headers: { 'User-Agent': 'OmniHealthCheck/1.0' },
            cache: 'no-store',
          });

          const duration = Date.now() - startTime;
          clearTimeout(timeoutId);

          let status = 'UNHEALTHY';
          if (res.status < 400) {
            status = duration > 1000 ? 'SLOW' : 'HEALTHY';
          }

          await prisma.app.update({
            where: { id: app.id },
            data: {
              healthStatus: status,
              lastCheckedAt: new Date(),
            },
          });

          return { id: app.id, name: app.name, status, duration };
        } catch (err: any) {
          clearTimeout(timeoutId);
          await prisma.app.update({
            where: { id: app.id },
            data: {
              healthStatus: 'UNHEALTHY',
              lastCheckedAt: new Date(),
            },
          });

          return { id: app.id, name: app.name, status: 'UNHEALTHY', error: err.message };
        }
      })
    );

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error('Failed to run health check cron:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
