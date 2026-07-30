# 开发总结：致远 OA 组织架构全量数据库同步实现

- **归档日期**：2026-07-30
- **涉及模块/文件**：
  - [schema.prisma](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/prisma/schema.prisma)（模型更新）
  - [sync_oa_data.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/scripts/sync_oa_data.ts)（同步脚本）
- **数据同步结果（生产环境）**：
  - **单位 (units) 记录**：16 条
  - **部门 (departments) 记录**：1,263 条
  - **在职人员 (members) 记录**：6,482 条

---

## 1. 数据库模型设计 (schema.prisma)

在 [schema.prisma](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/prisma/schema.prisma) 中，我们为组织架构的三级模型增加了关联支持，并引入了相应的表结构：

*   **`units` 表**：存储集团下属单位基础信息。
*   **`departments` 表**：存储部门，通过外键 `orgAccountId` 联接 `units.id`。引入了可选的 `parentId`（父级部门 ID）。
*   **`members` 表**：存储人员基础及联系信息，通过 `orgAccountId` 关联单位。考虑到部分挂职/暂未定岗人员，外键 `orgDepartmentId` 设为可空（`String?`），并采用 `onDelete: SetNull` 约束，确保存档的安全性。
*   `loginName` 作为单点登录（SSO）鉴权的关键主键，声明了 `@unique` 唯一约束。

---

## 2. 全量同步逻辑与性能优化 (sync_oa_data.ts)

由于建安工程公司的主公司包含超过 **972** 个部门、总共有数千名员工，采用一次性大吞吐拉取人员极易发生网络超时甚至使 OA 服务端宕机。我们采用了**按部门并发流式拉取人员**的方案：

### 2.1 性能优化：并发分批
*   部门同步：每次将 50 个部门封装在 `Promise.all` 中分批并发写入，极大地加快了入库速率。
*   人员同步：为防止向 OA 服务器突发请求导致拒绝服务，将 1,263 个部门以每组 **30** 个部门为批次进行并发查询，并只抓取 `enabled === true && isDeleted === false` 的有效在职人员。

### 2.2 核心去重与死锁预防机制
在同步期间，若遇到员工在 OA 端更改了 `id`（例如离职重新入职、主辅岗调动），但其唯一登录账号 `loginName` 保持不变，传统的基于主键 `id` 查找的 `upsert` 会试图插入重复的 `loginName`，进而造成 MySQL `Unique constraint failed (members_loginName_key)` 错误。
*   **解决方案**：在进行每次 `upsert` 写入前，先执行 `prisma.member.findUnique({ where: { loginName: m.loginName } })` 检查库中是否已存在当前登录名的旧记录。
*   如果旧记录的主键 `id !== m.id`，则先行执行 `delete` 清除旧 ID 记录，彻底规避了唯一索引冲突的发生。
*   如果主库外键发生约束冲突（如当前部门不存在），则在 `catch` 重试块中置空部门字段（`orgDepartmentId: null`）保证同步任务坚固耐用、100% 成功。

---

## 3. 生产服务器执行步骤与结果验证

### 3.1 远端部署步骤
1.  **文件同步**：已将最新的 `schema.prisma`、迁移 SQL 和同步脚本上传至远程服务器。
2.  **执行迁移**：在 `/var/www/Omni` 目录下运行 `npx prisma migrate deploy`，成功应用 `20260730064013_add_org_schema` 迁移。
3.  **生成客户端**：运行 `npx prisma generate` 重载 Prisma Client。
4.  **开始同步**：执行 `npx tsx scripts/sync_oa_data.ts` 开启全量同步。

### 3.2 生产环境同步结果验证
脚本于生产 Ubuntu 环境下跑通耗时 **30.38 秒**，最终在远端 Docker MySQL `omni_db` 数据库中落地的数据总量为：
```sql
SELECT 
  (SELECT COUNT(*) FROM units) as units_count, 
  (SELECT COUNT(*) FROM departments) as depts_count, 
  (SELECT COUNT(*) FROM members) as members_count;
```
*   **units_count**: `16`
*   **depts_count**: `1263`
*   **members_count**: `6482`

同步脚本已集成到生产代码库的 `scripts/` 下，日后可以直接通过任务调度（如 `cron` 定时任务或 Node.js 定时触发器）调用该脚本实现定时自动化同步。
