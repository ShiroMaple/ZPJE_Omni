---
contains:
  - knowledge
  - decision
---

# 角色权限体系解耦与 Master-Detail 工作台架构

## 1. 核心概念与数据模型解耦结论

| 权限维度 | 作用目标 | 数据存储 | 包含选项与定位 |
|---|---|---|---|
| **后台特权 (Admin Privilege)** | 控制谁能进入 `/admin` 管理后台操作 | `Member.adminType` | `SYS_ADMIN`（系统管理员）、`OPS_ADMIN`（运维管理员）、`DEPT_ADMIN`（部门管理员）、`NONE`（普通员工）。仅由系统管理员在后台分配，不参与前台业务应用过滤。 |
| **业务角色组 (Business Role)** | 控制员工在前台能看到并打开哪些业务应用 | `roles` 与 `member_roles` | `leader`（领导）、`operator`（高级操作员）、`welder`（管道质检组）及自定义业务角色。已从 `roles` 表中彻底清除 `admin` 与 `user`。 |

## 2. 应用权限判定公式

统一服务端预查与 SSO 网关逻辑：
$$\text{HasAccess} = \text{isPublic} \lor (\text{UserRoles} \cap \text{AppRoles} \neq \emptyset) \lor (\text{UserDept} \in \text{AppDepts})$$

## 3. 交互设计规范

1. **左右分栏（Master-Detail）工作台**：
   - 左侧（Master）：业务角色卡片列表，含动态人数角标、即时搜索与新建角色入口；
   - 右侧（Detail）：当前激活角色的成员名单、成员检索、批量添加与单人解绑。
2. **批量添加穿梭框**：
   - 支持按致远 OA 部门折叠树快速筛选员工，或全员按工号/账号检索多选。
3. **应用权限折叠树（DepartmentTreeSelect）**：
   - Radio 区分“全员免检可见”与“指定范围可见”；
   - 支持多层级部门展开折叠，父级部门一键级联选中所有子部门。
