import { headers } from 'next/headers';
import { prisma } from './prisma';

export async function checkAdmin(): Promise<boolean> {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  if (!userId || userId === 'guest') {
    return false;
  }
  
  // 允许特殊测试账户/系统账户直接具备管理员权限
  if (userId === 'admin' || userId === 'OmniRest') {
    return true;
  }
  
  try {
    const member = await prisma.member.findUnique({
      where: { loginName: userId }
    });
    return member?.isAdmin === true;
  } catch (err) {
    console.error('Error in checkAdmin lookup:', err);
    return false;
  }
}
