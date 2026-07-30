# 开发总结：第三阶段深度集成（RBAC 权限过滤与首页 Widget 引擎）

- **归档日期**：2026-07-30
- **涉及模块/文件**：
  - [prisma/schema.prisma](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/prisma/schema.prisma)（模型：`Role`, `MemberRole`, `AppRolePermission`, `AppDepartmentPermission`, `Widget`）
  - [prisma/seed.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/prisma/seed.ts)（角色初始化种子数据）
  - [app/api/admin/widgets/route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/admin/widgets/route.ts) / [[id]/route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/admin/widgets/[id]/route.ts)（Widget 后台 API）
  - [app/api/widgets/mock/route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/widgets/mock/route.ts)（大屏与指标 mock 数据服务）
  - [app/api/admin/apps/route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/admin/apps/route.ts) / [[id]/route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/admin/apps/[id]/route.ts)（扩展支持可见性与权限修改）
  - [app/page.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/page.tsx)（注入 RBAC 显隐过滤与 Widgets 渲染列表）
  - [app/Dashboard.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/Dashboard.tsx)（数据看板 Widget 渲染网格、Iframe 网格及 API 指标格）
  - [app/admin/AdminAppRegistry.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/admin/AdminAppRegistry.tsx) / [page.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/admin/page.tsx)（新增 Widget 配置 Tab、应用弹窗中可见性策略控制）
- **阶段状态**：已完成

---

## 1. 本阶段完成工作 (What Was Done)
*   **RBAC 角色权限与可见性隔离 (3.1)**：
    *   在数据库中建立了 `Role`, `MemberRole`, `AppRolePermission`, `AppDepartmentPermission` 完整的角色权限隔离关系模型。
    *   通过种子数据脚本预置了 `admin` (系统管理员), `operator` (高级操作员), `user` (普通员工) 角色。
    *   在应用编辑弹窗里集成了“所有员工免检可见”与“特定角色与部门限制可见”的选项，支持精细化的多选部门和多选角色隔离。
    *   在 `/` 首页加载应用列表时，会首先拉取当前 SSO 登入用户的致远部门与角色记录，自动将不属于用户可见权限的敏感应用过滤掉（系统管理员对此豁免）。
*   **首页 Widget 数据嵌合引擎 (3.2)**：
    *   设计并应用了 `Widget` 数据结构模型，支持绑定所属子系统、网格所占跨度（1/3、2/3 或 3/3 宽度）以及展现类型。
    *   开发了 **Widget 渲染引擎**：
        *   `iframe`：可以在首页看板格里直接无感嵌入子系统的可视化大屏或报表网页。
        *   `api`：可以向任何 API 地址拉取标准的指标结构数据，并在工作台自适应异步渲染出指标变化卡片。
    *   在管理后台新增了独立的 **“Widget 配置”** 控制中心，支持完整的表格展示、编辑修改、删除和新增操作。

## 2. 运维与踩坑经验 (Ops & Notes)
*   **注意事项**：当修改了 `schema.prisma` 新增模型并推送到远端服务器执行 `migrate deploy` 后，必须在远端服务器同步运行 `npx prisma generate`。否则在拉取或同步 `seed` 脚本填充角色时，Prisma 客户端会因为内存中没有新对象定义而抛出 `Cannot read properties of undefined (reading 'upsert')`。
*   **编译一致性**：每一次修改包含 API 接口和 UI 数据层的代码后，使用 `pnpm build` 可以提前发现因为 Prisma 升级带来的依赖注入类型错误，保障部署的稳定性。
