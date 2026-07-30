# 开发总结：应用注册中心与部门侧边栏筛选实现

- **归档日期**：2026-07-30
- **涉及模块/文件**：
  - [schema.prisma](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/prisma/schema.prisma)（模型关联及 `isAdmin` 扩充）
  - [scripts/sync_oa_data.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/scripts/sync_oa_data.ts)（同步逻辑扩充）
  - [app/admin/page.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/admin/page.tsx) / [AdminAppRegistry.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/admin/AdminAppRegistry.tsx)（管理后台）
  - [app/Sidebar.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/Sidebar.tsx) / [Dashboard.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/Dashboard.tsx)（侧边栏筛选）
- **阶段状态**：已完成

---

## 1. 本阶段完成工作 (What Was Done)
*   **模型关联**：在 `App` 模型中扩充了 `mainDeptId` 字段，外键指向 `Department` 模型的 `id` 属性，设置 `onDelete: SetNull` 保护。
*   **管理员身份支持**：在 `Member` 模型中扩充了 `isAdmin` 布尔字段。在组织架构同步脚本中，将 OA 系统原生的 `isAdmin` 标志写入 MySQL，并在 `lib/auth.ts` 中封装了校验工具。
*   **管理后台 UI**：新建了 `/admin` 路由及前后端交互层。支持新增、编辑、删除等完整的 CRUD 动作，部门选取按 **单位 -> 部门** 的两级树结构展现。
*   **部门侧边栏筛选**：门户首页在服务端过滤查询出所有包含至少一个子系统的活跃部门（Prisma: `where: { apps: { some: {} } }`），并实时输出各部门分类名下的应用计数角标。
*   **响应式适配**：在移动端/窄屏模式下，侧边栏能够折叠收起，用户可以通过导航栏的 "部门" 按钮唤出侧边毛玻璃抽屉进行筛选。

## 2. 核心架构与实现细节 (Technical Decisions)
*   **RBAC 与管理员判定**：在路由鉴权时，通过 `checkAdmin()` 函数读取请求头中的 `x-user-id`（用户名）。如匹配数据库中 `isAdmin === true` 的记录，则认定为管理员；同时在代码中为 `admin` 和 `OmniRest` 设定了测试白名单覆写。
*   **数据库查询优化**：侧边栏筛选仅展示有应用的部门。通过 `prisma.department.findMany` 过滤条件 `apps: { some: {} }`，在服务端一次性查出，避免了 N+1 次查询和内存计算。

## 3. 踩坑经验与避坑指南 (Pitfalls & Gotchas)
*   **遇到问题**：进行本地开发时，由于没有把 `isAdmin` 列添加到 `schema.prisma` 里的 `Member` 模型中，导致 `npm run build` 报 `Property 'isAdmin' does not exist on type 'Member'` 类型错误。
*   **解决方案**：将 `isAdmin Boolean @default(false)` 增加至 `schema.prisma` 并创建本地迁移，更新同步脚本 `sync_oa_data.ts` 的 upsert 参数使之向数据库录入此布尔值。
*   **避坑提示**：往后修改数据库结构时，务必先用 `npx prisma generate` 重新生成客户端类型，并保持本地和远端迁移的绝对一致性。

## 4. 下一步交接指引 (Handover Notes)
- [ ] 挂载探活后，继续测试离线与维护模式下的拦截策略是否按预期工作。
- [ ] 开发浅色/深色主题转换（§1.6）。
- **关联依赖**：可参考 [008_app_health_monitor_and_slo.md](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/docs/008_app_health_monitor_and_slo.md) 了解进一步细节。
