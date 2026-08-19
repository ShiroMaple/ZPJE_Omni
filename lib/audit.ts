import { prisma } from './prisma';
import { headers } from 'next/headers';

export async function recordSystemLog(
  loginName: string,
  actionType: 'SSO_LOGIN' | 'LOGOUT' | 'APP_ACCESS' | 'APP_MANAGE' | 'WIDGET_MANAGE' | 'ADMIN_MANAGE' | 'ROLE_MANAGE',
  detail: string
) {
  try {
    const headersList = await headers();
    const rawIp = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';
    const ip = rawIp.split(',')[0].trim();
    const userAgent = headersList.get('user-agent') || 'Unknown';

    // Retrieve user name
    const member = await prisma.member.findUnique({
      where: { loginName },
      select: { name: true }
    });
    const userName = member?.name || null;

    await prisma.systemLog.create({
      data: {
        loginName,
        userName,
        actionType,
        detail,
        ip,
        userAgent
      }
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
