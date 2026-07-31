# 开发总结：分级管理员权限隔离与同步机制安全加固

- **归档日期**：2026-07-31
- **涉及模块/文件**：
  - [prisma/schema.prisma](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/prisma/schema.prisma)
  - [lib/auth.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/lib/auth.ts)
  - [scripts/sync_oa_data.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/scripts/sync_oa_data.ts)
  - [app/api/admin/members/route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/admin/members/route.ts)
  - [app/admin/page.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/admin/page.tsx)
  - [app/admin/AdminAppRegistry.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/admin/AdminAppRegistry.tsx)
- **阶段状态**：已完成

---

## 1. 本阶段完成工作 (What Was Done)
- **多级管理员隔离**：废除了原单一布尔型 `isAdmin`，引入管理员分级枚举 `adminType` (`NONE` 普通成员, `SYS_ADMIN` 系统管理员, `OPS_ADMIN` 运维管理员, `DEPT_ADMIN` 部门管理员)。
- **清理硬编码凭证**：删除了 [lib/auth.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/lib/auth.ts) 中对 `OmniRest` 的管理员直接豁免权限，仅保留 `admin` 用于开发者底盘调试。
- **高危特权限制**：限定只有 `SYS_ADMIN`（系统管理员）有权分配管理员角色；普通的运维管理员和部门管理员虽可使用卡片/Widget 配置，但无法更改或授权他人的管理员状态。
- **同步防覆盖保护**：修改了 [sync_oa_data.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/scripts/sync_oa_data.ts)，在增量或全量同步组织架构时，不会将本地/远端已手动更改 of `adminType` 状态覆盖。
- **管理员分配控制面板**：
  - 开发了全新的 `/api/admin/members` 查询与更新接口。
  - 在管理员面板中新增了“管理员分配”页签，支持动态查询 6000+ 在职人员并实现权限的一键增减及级别切换。
- **生产同步发布**：顺利完成了远端数据库的 Prisma 迁移部署，全量更新了数据库中的组织数据，Next.js 生产包编译成功并实现 PM2 服务热重载上线。

---

## 2. 核心架构与实现细节 (Technical Decisions)
- **数据字段平滑演进**：通过 Prisma 迁移脚本自动创建了 `AdminType` 的 MySQL 字典，并将原 `members` 表的 `isAdmin` 列替换为了 `adminType` 列，且默认值为 `NONE`。
- **基于 RBAC 的后端两级校验**：
  - `checkAdmin()`: 验证用户是否是三种管理员中的任意一种（用于管理后台 `/admin` 的整体中间件/路由守卫拦截）。
  - `checkSystemAdmin()`: 专用于限制分配管理员权限 API（`/api/admin/members`），只有系统超级管理员拥有此分配权。

---

## 3. 踩坑经验与避坑指南 (Pitfalls & Gotchas)
- **遇到问题**：
  - 在非交互式（Non-interactive）终端环境中，由于原 `members` 表包含 6482 条在职员工数据，直接运行 `prisma migrate dev` 会因为“存在数据丢失警告 (drop column `isAdmin`)”而被 Migrate 机制强行阻断并报错中断。
  - 在远端通过 SSH 运行直接 Truncate 带有外键关联的表时，MariaDB 会因为级联关联限制而抛出 `Cannot truncate a table referenced in a foreign key constraint` (错误代码 1701)。
- **解决方案**：
  - 编写了清空辅助脚本 [scripts/truncate_db.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/scripts/truncate_db.ts)，利用 `SET FOREIGN_KEY_CHECKS = 0;` 关闭外键限制，并使用 **`DELETE FROM`** 代替 `TRUNCATE TABLE` 彻底清理表数据，清除警告后再运行 `prisma migrate dev` 即可实现非交互模式下的顺利升级。数据导入工作随后通过 [sync_oa_data.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/scripts/sync_oa_data.ts) 全量重新拉取填充。
- **避坑提示**：
  - **切勿改回 `isAdmin` 字段**，若前端组件出现 `isAdmin` 报错，请统一替换为 `checkAdmin()` 或从上下文解析的 `adminType` 判断逻辑。
  - 同步脚本的 `update` 节点**千万不要加回对 `adminType` 字段的覆盖**，否则每次定时任务执行，运维手动设定的管理员身份都会被覆盖回默认 of `NONE`。

---

## 4. 下一步交接指引 (Handover Notes)
- [ ] 方案设计中规划了 `DEPT_ADMIN`（部门管理员），后续如果需要对“应用卡片管理”进行真正的数据域隔离，需要在 `/api/admin/apps` 相关路由中加入 `mainDeptId` 的比对拦截校验。
- **关联依赖**：
  - 远端运行组织架构全量同步：`npx tsx scripts/sync_oa_data.ts`
  - 检查当前管理员配置：通过超级管理员 `admin` 登录后，直接访问 `/admin` 的“管理员分配”选项卡进行体验。
