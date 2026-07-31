import { headers } from 'next/headers';
import { prisma } from './prisma';

/**
 * 校验是否具备任何级别的管理员权限 (系统、运维、部门)
 */
export async function checkAdmin(): Promise<boolean> {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  if (!userId || userId === 'guest') {
    return false;
  }
  
  // 系统预置超级管理员
  if (userId === 'admin') {
    return true;
  }
  
  try {
    const member = await prisma.member.findUnique({
      where: { loginName: userId }
    });
    if (!member) return false;
    
    return (
      member.adminType === 'SYS_ADMIN' ||
      member.adminType === 'OPS_ADMIN' ||
      member.adminType === 'DEPT_ADMIN'
    );
  } catch (err) {
    console.error('Error in checkAdmin lookup:', err);
    return false;
  }
}

/**
 * 校验是否具备超级系统管理员权限 (仅 SYS_ADMIN / admin)
 */
export async function checkSystemAdmin(): Promise<boolean> {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  if (!userId || userId === 'guest') {
    return false;
  }
  
  if (userId === 'admin') {
    return true;
  }
  
  try {
    const member = await prisma.member.findUnique({
      where: { loginName: userId }
    });
    return member?.adminType === 'SYS_ADMIN';
  } catch (err) {
    console.error('Error in checkSystemAdmin lookup:', err);
    return false;
  }
}
