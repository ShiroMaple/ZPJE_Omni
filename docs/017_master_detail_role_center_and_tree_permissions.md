# 开发总结：Omni 统一门户角色权限体系与交互深度重构 (Master-Detail & TreeSelect)

- **归档日期**：2026-08-20
- **涉及模块/文件**：
  - [prisma/schema.prisma](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/prisma/schema.prisma)（在 `Role` 模型中新增 `description` 字段）
  - [prisma/seed.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/prisma/seed.ts)（清洗废弃角色，初始化真正的业务角色：`leader`, `operator`, `welder`）
  - [app/api/admin/roles/route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/admin/roles/route.ts)（业务角色列表带成员统计 `memberCount` & 自定义角色创建接口）
  - [app/api/admin/roles/[id]/members/route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/admin/roles/[id]/members/route.ts)（按角色查询成员列表 & 批量添加成员接口）
  - [app/api/admin/roles/[id]/members/[memberId]/route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/admin/roles/[id]/members/[memberId]/route.ts)（单人从角色移除接口）
  - [app/api/admin/departments/tree/route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/admin/departments/tree/route.ts)（多层级单位与部门树形接口）
  - [app/api/admin/members/route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/admin/members/route.ts)（支持部门 ID 过滤与全量检索员工接口）
  - [app/admin/page.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/admin/page.tsx)（服务端聚合查询层级树与角色成员统计）
  - [app/admin/AdminAppRegistry.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/admin/AdminAppRegistry.tsx)（前端交互核心：Master-Detail 左右分栏角色中心、穿梭弹窗、新建角色弹窗、带级联全选的折叠树组件）
  - [app/page.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/page.tsx)（前台 RBAC 权限判定逻辑对齐：$\text{HasAccess} = \text{isPublic} \lor (\text{UserRoles} \cap \text{AppRoles} \neq \emptyset) \lor (\text{UserDept} \in \text{AppDepts})$）
- **阶段状态**：已完成并全面验证（TypeScript 严格模式通过，`pnpm build` 0 errors / 0 warnings）

---

## 1. 本阶段完成工作 (What Was Done)

1. **核心概念与数据模型彻底解耦**：
   - **后台特权（Admin Privilege）**：存储于 `Member.adminType`（`SYS_ADMIN` / `OPS_ADMIN` / `DEPT_ADMIN` / `NONE`），专用于进入 `/admin` 管理后台授权，不参与前台应用卡片过滤。
   - **业务角色组（Business Role）**：存储于 `roles` 与 `member_roles`，专用于控制员工在前台能看到并访问哪些业务应用。
   - **字典清洗**：从 `roles` 表中彻底清理了混用的 `admin` 和 `user`，扩展了真正的业务角色（`leader` 领导、`operator` 高级操作员、`welder` 管道质检组）。

2. **后端 API 体系升级**：
   - 新增 `GET /api/admin/roles`：查询所有有效业务角色并聚合 `memberCount`。
   - 新增 `POST /api/admin/roles`：支持动态新建自定义业务角色。
   - 新增 `GET /api/admin/roles/[id]`：查询指定角色的详细信息。
   - 新增 `PUT /api/admin/roles/[id]`：修改指定业务角色的 `key`、`name`、`description`（带唯一性冲突检查与审计日志）。
   - 新增 `DELETE /api/admin/roles/[id]`：删除指定业务角色（级联清理关联成员及应用授权，带审计日志）。
   - 新增 `GET /api/admin/roles/[id]/members`：查询特定角色成员列表。
   - 新增 `POST /api/admin/roles/[id]/members`：支持通过 `{ memberIds: string[] }` 幂等批量添加成员并记录审计日志。
   - 新增 `DELETE /api/admin/roles/[id]/members/[memberId]`：单人从角色中解绑。
   - 新增 `GET /api/admin/departments/tree`：递归构造单位与部门的层级折叠树结构。

3. **前端交互重构（Tab 3 角色中心 Master-Detail 左右分栏）**：
   - **废弃顶部卡片与平铺行内按钮**：淘汰了占空间的 4 个顶部卡片和人员列表中密密麻麻的 `+` 按钮。
   - **左侧角色列表侧栏 (Master)**：支持角色关键字即时搜索过滤、`[+ 新建角色]` 弹窗、卡片式角色项（含业务图标、名称、Key、描述与右侧动态人数角标 `N人`）。
   - **右侧角色成员工作区 (Detail)**：选定左侧角色后，右侧展示角色详情、内置成员检索过滤框、高亮 `[+ 批量添加成员]` 按钮、`[编辑角色]` 按钮、`[删除角色]` 按钮、成员表格与单人 `[移除角色]` 按钮。
   - **角色编辑弹窗 (`EditRoleModal`)**：支持即时编辑角色的 key（英文标识）、name（名称）与 describe（业务职责说明），保存后即时响应式同步。
   - **角色删除保护与级联清理**：删除角色前提示将级联解除所有已绑定员工与应用授权，确认后彻底删除并在界面上无缝切换至下一个角色。
   - **穿梭/多选弹窗 (`AddMemberModal`)**：支持左侧按致远 OA 部门快速过滤，右侧按姓名/工号/账号全员搜索，支持全选与多选批量加入角色。
   - **即时响应式状态同步**：添加/移除成员/编辑角色/删除角色后，右侧表格与左侧角色列表均即时响应式更新，无需手动刷新整页。

4. **应用权限编辑弹窗（Modal）结构化升级**：
   - **单选切换 (Radio Group)**：清晰拆分为 `全员免检可见` 与 `指定范围可见`。
   - **逻辑关系明确**：文案显式标注 `满足任一条件（Role OR Department）即可访问`。
   - **业务角色 Tag 复选**：以 Tag 形式展示所有可用业务角色。
   - **部门折叠树组件 (`DepartmentTreeSelect`)**：支持父子节点展开/折叠、即时搜索高亮、父级部门一键级联全选/反选所有子部门。

---

## 2. 核心架构与实现细节 (Technical Decisions)

### 2.1 权限判定公式统一
无论是服务端 `app/page.tsx` 页面预过滤，还是 SSO 网关，统一遵循判定公式：
$$\text{HasAccess} = \text{isPublic} \lor (\text{UserRoles} \cap \text{AppRoles} \neq \emptyset) \lor (\text{UserDept} \in \text{AppDepts})$$
- 若管理员勾选了“全员免检可见”（`visibleToAll = true`），则免检。
- 否则，只要登录用户的角色包含在应用所授权的角色列表中，或者用户所属部门包含在应用所授权的部门列表中，即可正常查看与进入。

### 2.2 部门树递归级联选择算法
```typescript
function getAllDescendantDeptIds(node: DepartmentTreeNode): string[] {
  const ids = [node.id];
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      ids.push(...getAllDescendantDeptIds(child));
    }
  }
  return ids;
}
```
当勾选某个父级部门时，算法自动收集该部门节点及其所有子孙节点的 ID 集合，合并到当前已选 `selectedDeptIds` 中；取消勾选时统一过滤移除，极大提升了跨层级多部门授权效率。

---

## 3. 踩坑经验与避坑指南 (Pitfalls & Gotchas)

1. **审计日志函数签名**：
   - `lib/audit.ts` 导出的是 `recordSystemLog(operator, actionType, detail)`，非通用的 `logAudit`，且在 Next.js Server Components / Route Handlers 中需要先通过 `await headers()` 读取 `x-user-id` 获取当前操作人。
2. **PowerShell 引号与 `$` 变量插值**：
   - 在 Windows PowerShell 环境中执行包含 `$` 的脚本（如 Prisma `$disconnect`）时，需避免直接在双引号字符串中书写，建议编写独立的 `.ts` 脚本执行。
3. **本地数据库迁移与字段同步**：
   - 当向 `Role` 表增加 `description` 字段时，执行了 `ALTER TABLE roles ADD COLUMN description TEXT NULL`，并运行了 `pnpm exec prisma generate` 以同步 TypeScript Client 类型。

---

## 4. 下一步交接指引 (Handover Notes)

- [x] 本地已启动 MySQL 3306 端口并完成数据结构迁移。
- [x] 成功执行 `pnpm build`（Turbopack + TypeScript 检查通过，0 编译错误）。
- [x] 已完成角色分配、成员添加、成员移除的端到端集成测试。
- [ ] **等待用户验收确认**：本地功能重构已全部完成，等待用户在本地环境体验确认后，再安排推送至线上服务器部署。
