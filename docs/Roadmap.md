# Omni 统一门户 — 产品路线图 (Roadmap)

> **愿景**：将 Omni 从 MVP 工作台升级为长久立足的企业级门户平台，核心思想是**将"代码硬编码"解耦为"配置与数据驱动"**。
>
> **技术栈**：Next.js (App Router, TypeScript) + Prisma 7 + MySQL 8.0 + 致远 OA SSO
>
> **UI 设计规范**：遵循 [DESIGN_Expo.md](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/docs/DESIGN_Expo.md) 定义的 Expo 设计语言 — 单色冷灰体系、Inter 字体、药丸圆角、Cloud Gray (`#f0f0f3`) 画布、极致留白节奏。所有前端 UI 开发必须严格参考该文档的色彩、字体、组件、阴影与布局规范。
>
> **最后更新**：2026-07-30

---

## 〇、基础设施（已完成）

以下为 MVP 阶段已落地的基础能力，构成后续所有功能的技术底座。

- [x] **项目脚手架搭建** — Next.js 16 + TypeScript + Tailwind CSS v4 + App Router
  - 参考：[001_omni_portal_setup.md](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/docs/001_omni_portal_setup.md)
- [x] **致远 OA 单点登录 (SSO)** — CIP 门户认证两阶段握手 + 内存 Ticket 缓存（含 60s 自动清理）
  - 参考：[002_seeyon_sso_integration.md](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/docs/002_seeyon_sso_integration.md)
- [x] **根域名 JWT Cookie 免登体系** — `.izpje.com` 域 Cookie 实现子应用无感共享登录
  - 参考：[001_omni_portal_setup.md](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/docs/001_omni_portal_setup.md)
- [x] **Prisma 7 + MySQL 8.0 单例客户端** — 含 MariaDB 驱动适配器、热重载连接池保护
  - 参考：[003_prisma_mysql_decoupling.md](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/docs/003_prisma_mysql_decoupling.md)
- [x] **远程 Docker MySQL 生产部署** — 127.0.0.1 绑定安全加固 + 宿主机数据持久化
  - 参考：[004_remote_mysql_setup.md](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/docs/004_remote_mysql_setup.md)
- [x] **应用卡片数据库驱动** — `apps` 表 + `prisma/seed.ts` 幂等初始化，首页动态渲染
  - 参考：[004_remote_mysql_setup.md](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/docs/004_remote_mysql_setup.md)
- [x] **OA 组织架构全量同步** — 单位 16 / 部门 1,263 / 在职人员 6,482 条，支持并发分批 + 去重
  - 参考：[006_oa_data_sync_implementation.md](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/docs/006_oa_data_sync_implementation.md)
- [x] **OA REST API 认证凭据安全管理** — 密码从文档/源码中移除，统一由 `.env` 管理
- [x] **子应用接入模板** — `docs/child-app-middleware-template.ts` 可直接复用
  - 参考：[001_omni_portal_setup.md](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/docs/001_omni_portal_setup.md)
- [x] **登录失败页** — `/login-failed` 含错误引导与一键重试

---

## 一、第一阶段：基础运维与扩展（优先落地）

### 1.1 动态应用注册中心（App Registry）

> 后台支持动态增删改查子应用，门户根据数据库实时渲染。

- [x] 设计 `App` 数据模型（`apps` 表），含 key/name/description/url/icon/category 等字段
- [x] 实现 `prisma/seed.ts` 幂等种子数据初始化（5 个预置应用）
- [x] 首页 `page.tsx` 改为从数据库动态查询 → 传递给客户端 `Dashboard.tsx` 渲染
- [x] **应用分类与部门标签系统**
  - [x] `App` 模型新增 `mainDeptId` 字段（外键关联 `departments.id`），表示应用所属部门
  - [x] 设定默认值语义为"未分类"（`mainDeptId = null` 时视为未分类）
  - [x] 管理后台维护应用时，`mainDeptId` 为必填项，选取控件按 **单位 → 部门** 层级展示
- [x] **管理后台 UI（Admin Panel）**
  - [x] 新增 `/admin` 路由（仅管理员可访问）
  - [x] 实现应用列表页：展示所有已注册应用，支持搜索/排序
  - [x] 实现应用编辑表单：名称、图标、URL、简介、分类、所属部门、维护模式开关、排序权值
  - [x] 实现应用新增 / 删除功能
  - [x] 实现对应的 CRUD API 路由（`/api/admin/apps`）

### 1.2 门户左侧部门切片器（Sidebar Filter）

> 在门户左侧设置侧边栏，以部门维度对应用进行筛选。

- [x] 实现左侧侧边栏组件（`Sidebar.tsx`）
- [x] 查询所有 `mainDeptId` 不为空、且名下 app 数量 > 0 的部门列表
- [x] 侧边栏展示这些部门名称，点击后筛选出对应部门下的应用卡片
- [x] 提供"全部应用"选项清除筛选
- [x] 响应式布局：移动端侧边栏可折叠

### 1.3 子应用健康探活与故障降级（App Health Monitor）

> 门户自动检测子系统存活状态，异常时友好提示替代 502 报错。

- [x] `App` 模型已预留 `healthStatus` 和 `lastCheckedAt` 字段
- [x] **后端健康检测服务**
  - [x] 新增 `/api/cron/health-check` 路由（或独立脚本），定时（如每 30s）向各子系统 URL 发起 HTTP HEAD 探活
  - [x] 根据响应状态码更新 `healthStatus`：`200` → `HEALTHY`，`>500ms` → `SLOW`，`5xx/超时` → `UNHEALTHY`
  - [x] 更新 `lastCheckedAt` 时间戳
- [x] **前端状态可视化**
  - [x] 应用卡片上根据 `healthStatus` 显示状态指示灯：🟢 运行中 / 🟡 响应迟缓 / 🔴 服务异常
  - [x] 服务异常时，点击卡片弹出友好提示弹窗（"该系统当前维护中，请稍后再试"），而非直接跳转

### 1.4 应用维护模式

> 管理员可在后台将某个子系统标记为"维护中"，禁止普通用户跳转。

- [x] `App` 模型已预留 `isMaintenance` 布尔字段
- [x] 管理后台增加维护模式开关按钮
- [x] 前端卡片在 `isMaintenance=true` 时显示"维护中"标识，禁止点击跳转
- [x] 维护模式下卡片样式变为灰色/半透明

### 1.5 完整单点登出（SLO）

> 退出登录时清除本地 Cookie 并通知致远 OA 释放会话。

- [x] JWT Payload 中已包含 `ticket` 字段（[route.ts#L60](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/sso/seeyon/route.ts#L60)）
- [x] 后端 `/api/auth/logout` API 已实现：清除 Cookie + 异步通知 OA `logoutNotify`
  - 参考：[route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/auth/logout/route.ts)
- [x] **前端退出按钮**
  - [x] 在 `Dashboard.tsx` Header 的用户 Profile 区域添加"退出登录"按钮
  - [x] 点击后调用 `POST /api/auth/logout`，成功后刷新页面或跳转至登录引导页
- [x] **会话超时自动登出**
  - [x] JWT 过期后（8 小时），前端检测到 401/无效 token 时自动触发登出流程
  - [x] 超时登出同样通知致远 OA 释放会话

### 1.6 明暗模式切换（Theme Toggle）

> 支持浅色/深色两套主题，默认浅色模式。浅色模式严格遵循 [DESIGN_Expo.md](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/docs/DESIGN_Expo.md) 规范。

- [ ] **浅色主题（默认）** — 严格对齐 Expo 设计系统
  - [ ] 页面画布使用 Cloud Gray (`#f0f0f3`)，卡片/容器使用 Pure White (`#ffffff`)
  - [ ] 标题使用 Expo Black (`#000000`)，正文使用 Near Black (`#1c2024`)，辅助文字使用 Slate Gray (`#60646c`)
  - [ ] 边框使用 Border Lavender (`#e0e1e6`)，交互边框使用 Input Border (`#d9d9e0`)
  - [ ] 阴影遵循 Expo 低调层级（Whisper / Standard Elevation）
  - [ ] 圆角遵循 Expo 药丸体系：按钮 6px、卡片 8px、图片容器 24px、主 CTA 9999px
  - [ ] 字体统一使用 Inter（400-900 全权重），标题极致负字距（-1.6px ~ -3px at 64px）
- [ ] **深色主题** — 基于 Expo 体系的暗色衍生
  - [ ] 画布使用 Widget Dark (`#1a1a1a`)，卡片使用 Banner Dark (`#171717`) 或 `#222`
  - [ ] 文字使用 Pure White / Silver (`#b0b4ba`) 等亮色层级
  - [ ] 边框使用 Dark Slate (`#363a3f`)，阴影适当加深
- [ ] 建立 CSS 变量体系，分 `[data-theme="light"]` / `[data-theme="dark"]` 两套令牌
- [ ] 实现 `ThemeToggle` 组件（Header 导航栏中放置明暗切换图标按钮）
- [ ] 用户偏好持久化至 `localStorage`，默认值为 `light`
- [ ] 全面适配 Dashboard、Sidebar、卡片、Header、Command Palette 等组件的双主题样式

---

## 二、第二阶段：体验升级

### 2.1 个性化工作台（Personalized Workspace）

#### 2.1.1 常用应用收藏（Favorite Apps）

> 允许用户置顶或收藏自己高频使用的 3~5 个子系统。

- [ ] 数据库新增 `UserFavorite` 模型（`user_favorites` 表），关联 `loginName` + `appId`
- [ ] 实现收藏/取消收藏 API（`POST/DELETE /api/user/favorites`）
- [ ] 卡片右上角增加收藏星标按钮
- [ ] 首页顶部展示"我的收藏"区域，置顶显示已收藏应用

#### 2.1.2 最近使用历史（Recently Used）

> 自动记录并呈现用户近期访问过的应用，减少查找路径。

- [ ] 数据库新增 `AccessLog` 模型（`access_logs` 表），记录 `loginName` + `appId` + `timestamp`
- [ ] 用户点击应用卡片时，调用 API 记录访问事件
- [ ] 首页展示"最近使用"区域，按时间倒序显示最近 5 个访问过的应用

### 2.2 全局搜索 / 指令面板（Command Palette / `Ctrl+K`）

> 键盘快捷键弹出全局搜索框，快速模糊匹配并打开子应用。

- [ ] 实现 `CommandPalette.tsx` 弹窗组件
- [ ] 监听 `Ctrl+K` / `Cmd+K` 全局快捷键
- [ ] 支持拼音/关键字模糊搜索应用名称与描述
- [ ] 搜索结果支持键盘上下选择 + 回车直达
- [ ] 搜索结果高亮匹配文本

### 2.3 访问审计与行为日志（Audit Logging）

> 记录"谁在什么时间通过门户访问了哪个子系统"。

- [ ] 复用 2.1.2 的 `AccessLog` 模型，扩展字段：`ip`, `userAgent`
- [ ] 实现记录 API 中间件，在用户点击应用跳转时自动写入审计日志
- [ ] 管理后台新增"访问统计"页面
  - [ ] 各应用访问频次热度排行榜
  - [ ] 按时间范围筛选（近 7 天 / 30 天 / 自定义）
  - [ ] 访问趋势折线图

---

## 三、第三阶段：深度集成

### 3.1 RBAC 角色权限与可见性隔离

> 结合致远 OA 用户角色/部门信息，控制敏感应用仅特定权限组可见。

- [ ] 设计 `Role` 和 `AppPermission` 模型
- [ ] 将 SSO 登录时获取的 `loginName` 匹配到 `members` 表中的部门/单位信息
- [ ] 支持按角色/部门维度配置应用可见性规则
- [ ] 前端根据当前用户权限动态过滤应用卡片
- [ ] 管理后台提供权限配置界面

### 3.2 首页 Widget 微卡片数据嵌合

> 在门户首页嵌入各子系统的关键数据摘要。

- [ ] 设计 Widget 数据模型与组件规范
- [ ] 实现 Widget 渲染引擎（支持 iframe / API 数据注入两种模式）
- [ ] 首页布局支持 Widget 网格区域
- [ ] 管理后台支持配置 Widget 数据源与布局

### 3.3 统一待办与消息聚合（Unified Notification Hub）

> 轮询或通过 Webhook 接收致远 OA 的待办公文数量以及各子系统的关键告警。

> [!NOTE]
> **暂不实现**：涉及与其它子系统的深度联动，保留意见待后续评估。

- [ ] 设计消息聚合 API 与轮询/Webhook 机制
- [ ] 对接致远 OA 待办公文数量接口
- [ ] 对接各子系统告警推送（如 DocEx 解析完成通知）
- [ ] Header 区域统一消息提醒铃铛图标 + 未读数角标

---

## 四、运维保障（持续性事项）

> 以下为贯穿各阶段的运维与技术债务清理任务。

### 4.1 Ticket 缓存监控与集群扩展

- [x] 内存缓存 `verifiedTickets` 已实现 60 秒自动清理（[route.ts#L31-L37](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/sso/seeyon/route.ts#L31-L37)）
- [ ] 观察生产日志，确认过期 Ticket 清理无异常
- [ ] 若未来部署多 PM2 实例或容器多副本，将 `verifiedTickets` 迁移至 Redis 共享缓存

### 4.2 子应用认证中间件接入验证

- [x] 接入模板已编写：[child-app-middleware-template.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/docs/child-app-middleware-template.ts)
- [ ] 协助 `WeldSnap` 接入统一门户 JWT Cookie 校验，完成集成测试
- [ ] 协助 `FabFlow` 接入统一门户 JWT Cookie 校验，完成集成测试

### 4.3 组织架构定时同步

- [x] 全量同步脚本 `scripts/sync_oa_data.ts` 已在生产验证通过
- [ ] 配置 `cron` 定时任务（如每日凌晨 2:00）自动执行增量/全量同步
- [ ] 增加同步结果通知机制（成功/失败日志告警）

### 4.4 生产环境域名与部署

- [ ] 确认 `omni.izpje.com` DNS 解析已配置到部署主机
- [ ] 确保生产 `.env` 中所有环境变量正确配置且无硬编码敏感信息

---

## 五、演进路线总览

```text
【第一阶段：基础运维与扩展】 ← 当前重点
  ├── 1.1 动态应用注册中心 + 管理后台          ██████████ 100% (已完成模型、渲染、管理后台 UI、级联所属部门)
  ├── 1.2 门户左侧部门切片器                   ██████████ 100% (已完成侧边栏过滤与移动端抽屉折叠)
  ├── 1.3 子应用健康探活                        ██████████ 100% (已实现并行 GET 探测 API 与 Linux Cron 定时任务)
  ├── 1.4 应用维护模式                          ██████████ 100% (已在管理后台实现开关并增加了前端灰度/拦截警告框)
  ├── 1.5 完整单点登出 (SLO)                    ██████████ 100% (已完成登出注销按钮与 30s session_active 超时自动登出)
  └── 1.6 明暗模式切换                          ░░░░░░░░░░ 0%

【第二阶段：体验升级】
  ├── 2.1 常用应用收藏 + 最近访问记录            ░░░░░░░░░░ 0%
  ├── 2.2 全局 Ctrl+K 搜索框                    ░░░░░░░░░░ 0%
  └── 2.3 审计日志 (应用点击量统计)              ░░░░░░░░░░ 0%

【第三阶段：深度集成】
  ├── 3.1 动态 RBAC 权限 (按部门/角色显示卡片)   ░░░░░░░░░░ 0%
  ├── 3.2 首页 Widget 微卡片数据嵌合             ░░░░░░░░░░ 0%
  └── 3.3 致远 OA 待办事项聚合                   ░░░░░░░░░░ 0% (暂缓)
```

---

> **备注**：本文件由原 `TodoList.md` 整合演化而来。原 TodoList 中的三项待办事项已按完成状态融入对应章节：
> - ~~退出登录通知致远 OA~~ → §1.5 完整单点登出
> - ~~监控与清理过期 Ticket 内存缓存~~ → §4.1 Ticket 缓存监控
> - ~~子应用认证中间件接入验证~~ → §4.2 子应用认证接入
