import 'dotenv/config';
import { prisma } from '../lib/prisma';

const OA_HOST = process.env.SEEYON_OA_HOST;
const USERNAME = process.env.SEEYON_OA_REST_USERNAME;
const PASSWORD = process.env.SEEYON_OA_REST_PASSWORD;

if (!OA_HOST || !USERNAME || !PASSWORD) {
  console.error('❌ 缺少必要的环境变量: SEEYON_OA_HOST, SEEYON_OA_REST_USERNAME, SEEYON_OA_REST_PASSWORD');
  process.exit(1);
}

async function fetchToken(): Promise<string> {
  const url = `${OA_HOST}/seeyon/rest/token?option.n_a_s=1`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName: USERNAME, password: PASSWORD })
  });
  if (res.status !== 200) {
    throw new Error(`Failed to fetch REST token: Status ${res.status}`);
  }
  const data = await res.json();
  return data.id;
}

interface OaAccount {
  id: string;
  name: string;
  code: string | null;
  enabled: boolean;
}

interface OaDepartment {
  id: string;
  name: string;
  code: string | null;
  enabled: boolean;
  orgAccountId: string;
  parentId: string | null;
}

interface OaMember {
  id: string;
  name: string;
  loginName: string;
  code: string | null;
  telNumber: string | null;
  emailAddress: string | null;
  enabled: boolean;
  isDeleted: boolean;
  isAdmin: boolean;
  orgAccountId: string;
  orgDepartmentId: string | null;
}

async function runSync() {
  console.log('🚀 开始 OA 组织架构全量同步任务...');
  const startTime = Date.now();
  
  // 1. 获取 REST Token
  let token: string;
  try {
    token = await fetchToken();
    console.log(`🔑 获取 Token 成功: ${token}`);
  } catch (err: any) {
    console.error('❌ 获取 Token 失败:', err.message);
    process.exit(1);
  }

  // 2. 拉取所有单位 (Units)
  console.log('\n--- 正在拉取单位数据 ---');
  let oaAccounts: OaAccount[] = [];
  try {
    const res = await fetch(`${OA_HOST}/seeyon/rest/orgAccounts?option.n_a_s=1`, {
      headers: { 'token': token }
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    oaAccounts = await res.json();
    console.log(`💡 OA 系统中共查询到 ${oaAccounts.length} 个单位`);
  } catch (err: any) {
    console.error('❌ 拉取单位失败:', err.message);
    process.exit(1);
  }

  // 同步单位数据到数据库
  let syncedUnitsCount = 0;
  for (const acc of oaAccounts) {
    await prisma.unit.upsert({
      where: { id: acc.id },
      update: {
        name: acc.name,
        code: acc.code,
        enabled: acc.enabled
      },
      create: {
        id: acc.id,
        name: acc.name,
        code: acc.code,
        enabled: acc.enabled
      }
    });
    syncedUnitsCount++;
  }
  console.log(`✅ 单位同步完成，共写入/更新 ${syncedUnitsCount} 个单位`);

  // 3. 拉取所有部门 (Departments)
  console.log('\n--- 正在拉取部门数据 ---');
  let allOaDepts: OaDepartment[] = [];
  for (const acc of oaAccounts) {
    try {
      const res = await fetch(`${OA_HOST}/seeyon/rest/orgDepartments/${acc.id}?option.n_a_s=1`, {
        headers: { 'token': token }
      });
      if (res.status === 200) {
        const depts: OaDepartment[] = await res.json();
        allOaDepts.push(...depts);
      }
    } catch (err: any) {
      console.warn(`⚠️ 拉取单位 ${acc.name} 的部门失败:`, err.message);
    }
  }
  console.log(`💡 所有单位下共查询到 ${allOaDepts.length} 个部门`);

  // 同步部门数据 (每批 50 并行写入以提高效率)
  let syncedDeptsCount = 0;
  const deptBatchSize = 50;
  for (let i = 0; i < allOaDepts.length; i += deptBatchSize) {
    const batch = allOaDepts.slice(i, i + deptBatchSize);
    await Promise.all(batch.map(async (dept) => {
      await prisma.department.upsert({
        where: { id: dept.id },
        update: {
          name: dept.name,
          code: dept.code,
          enabled: dept.enabled,
          orgAccountId: dept.orgAccountId,
          parentId: dept.parentId
        },
        create: {
          id: dept.id,
          name: dept.name,
          code: dept.code,
          enabled: dept.enabled,
          orgAccountId: dept.orgAccountId,
          parentId: dept.parentId
        }
      });
      syncedDeptsCount++;
    }));
  }
  console.log(`✅ 部门同步完成，共写入/更新 ${syncedDeptsCount} 个部门`);

  // 4. 按部门拉取所有在职人员 (Members)
  console.log('\n--- 正在按部门拉取在职人员数据 ---');
  let totalOaMembersCount = 0;
  let activeMembersToUpsert: OaMember[] = [];
  const processedMemberIds = new Set<string>();
  const processedLoginNames = new Set<string>();

  // 为提高拉取性能，以 30 个部门为一组进行并发请求
  const deptQueryBatchSize = 30;
  for (let i = 0; i < allOaDepts.length; i += deptQueryBatchSize) {
    const batchDepts = allOaDepts.slice(i, i + deptQueryBatchSize);
    
    await Promise.all(batchDepts.map(async (dept) => {
      try {
        const res = await fetch(`${OA_HOST}/seeyon/rest/orgMembers/department/${dept.id}?option.n_a_s=1&firstLayer=true`, {
          headers: { 'token': token }
        });
        if (res.status === 200) {
          const members: OaMember[] = await res.json();
          for (const m of members) {
            totalOaMembersCount++;
            // 筛选正常在职人员 (enabled=true 且 isDeleted=false) 并且过滤空/重复登录名
            if (m.enabled && !m.isDeleted && m.loginName && !processedMemberIds.has(m.id) && !processedLoginNames.has(m.loginName)) {
              processedMemberIds.add(m.id);
              processedLoginNames.add(m.loginName);
              activeMembersToUpsert.push(m);
            }
          }
        }
      } catch (err: any) {
        // 部分空部门或接口异常忽略，继续处理
      }
    }));
    
    if (i > 0 && i % 150 === 0) {
      console.log(`⌛ 已处理 ${i} / ${allOaDepts.length} 个部门，当前收集到在职人员 ${activeMembersToUpsert.length} 人`);
    }
  }

  console.log(`💡 扫描到 OA 全量人员记录 ${totalOaMembersCount} 条，去重并过滤出在职人员 ${activeMembersToUpsert.length} 人`);

  // 同步在职人员数据 (每批 50 并行写入数据库)
  let syncedMembersCount = 0;
  const memberBatchSize = 50;
  for (let i = 0; i < activeMembersToUpsert.length; i += memberBatchSize) {
    const batch = activeMembersToUpsert.slice(i, i + memberBatchSize);
    await Promise.all(batch.map(async (m) => {
      try {
        // 核心去重预防逻辑：检查库中是否已存在相同的 loginName 但 id 不同的记录，若存在则删除旧记录
        const existing = await prisma.member.findUnique({
          where: { loginName: m.loginName }
        });
        if (existing && existing.id !== m.id) {
          await prisma.member.delete({
            where: { id: existing.id }
          });
        }

        await prisma.member.upsert({
          where: { id: m.id },
          update: {
            name: m.name,
            loginName: m.loginName,
            code: m.code,
            telNumber: m.telNumber,
            emailAddress: m.emailAddress,
            enabled: m.enabled,
            isDeleted: m.isDeleted,
            isAdmin: !!m.isAdmin,
            orgAccountId: m.orgAccountId,
            orgDepartmentId: m.orgDepartmentId
          },
          create: {
            id: m.id,
            name: m.name,
            loginName: m.loginName,
            code: m.code,
            telNumber: m.telNumber,
            emailAddress: m.emailAddress,
            enabled: m.enabled,
            isDeleted: m.isDeleted,
            isAdmin: !!m.isAdmin,
            orgAccountId: m.orgAccountId,
            orgDepartmentId: m.orgDepartmentId
          }
        });
        syncedMembersCount++;
      } catch (err: any) {
        console.error(`❌ 第一步同步人员 ${m.name} (${m.loginName}) 失败:`, err.message);
        // 如果外键约束冲突（如部门 ID 没拉取到），尝试置空部门 ID 再次保存
        try {
          // 在重试前，同样确保清理掉具有相同 loginName 但不同 id 的记录
          const existing = await prisma.member.findUnique({
            where: { loginName: m.loginName }
          });
          if (existing && existing.id !== m.id) {
            await prisma.member.delete({
              where: { id: existing.id }
            });
          }

          await prisma.member.upsert({
            where: { id: m.id },
            update: {
              name: m.name,
              loginName: m.loginName,
              code: m.code,
              telNumber: m.telNumber,
              emailAddress: m.emailAddress,
              enabled: m.enabled,
              isDeleted: m.isDeleted,
              isAdmin: !!m.isAdmin,
              orgAccountId: m.orgAccountId,
              orgDepartmentId: null
            },
            create: {
              id: m.id,
              name: m.name,
              loginName: m.loginName,
              code: m.code,
              telNumber: m.telNumber,
              emailAddress: m.emailAddress,
              enabled: m.enabled,
              isDeleted: m.isDeleted,
              isAdmin: !!m.isAdmin,
              orgAccountId: m.orgAccountId,
              orgDepartmentId: null
            }
          });
          syncedMembersCount++;
          console.log(`✅ 重试同步人员 ${m.name} (${m.loginName}) 成功（已置空部门ID）`);
        } catch (innerErr: any) {
          console.error(`❌ 重试同步人员 ${m.name} (${m.loginName}) 依然失败:`, innerErr.message);
        }
      }
    }));
  }

  console.log(`✅ 在职人员同步完成，共写入/更新 ${syncedMembersCount} 个在职人员`);
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n🎉 全量同步工作圆满完成！总耗时: ${elapsed} 秒。`);
}

runSync()
  .catch((err) => {
    console.error('❌ 同步异常中断:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
