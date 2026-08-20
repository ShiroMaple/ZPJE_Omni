# Project Cairn Log

This file records substantive progress in reverse-chronological order — newest entry at the top, right below this line. Keep each entry short — summary and pointer only; conclusions settle into `cairn/<topic>.md`.

## 2026-08-20 · 管理后台侧边栏固定、入口迁移与统计翻页控件恢复
- 优化管理后台布局为 `h-screen overflow-hidden`，侧边栏高度独立固定不随工作区滚动。
- “返回门户前台”入口迁移至页面顶部右上角明暗切换按钮左侧。
- 完整恢复“访问与审计统计”标签页下子系统访问统计（时间跨度与翻页）和系统审计日志（关键词搜索、操作类型下拉与翻页）的筛选与分页控件。
- 自动化部署并同步至生产服务器，构建并通过验证（PM2 online）。

## 2026-08-20 · 生产服务器部署完成
- 代码同步并推送到 GitHub 远程仓库 `ShiroMaple/ZPJE_Omni`。
- 生产服务器（192.168.103.191）完成代码同步、Prisma 客户端重新生成、角色表迁移与预置数据同步、生产环境打包构建（`pnpm build`）与 PM2 服务平滑重启（`pm2 restart Omni`）。
- 生产环境服务状态已验证（HTTP 200 OK，Ready in 218ms）。

## 2026-08-20 · 角色权限体系解耦与 Master-Detail 角色中心重构
- 彻底解耦后台管理特权（`Member.adminType`）与业务访问角色（`roles` / `member_roles`），清洗废弃角色字典。
- 业务角色管理重构为 Master-Detail 左右分栏工作台，支持管理员编辑业务角色的 key、name、description 与安全删除角色。
- 支持按致远 OA 部门快速穿梭批量加人与单人移除，各处人数与状态实时响应。
- 应用编辑弹窗升级为 Radio 显式授权与多层级部门折叠树（带搜索与父子级联全选）。
- 详见主题笔记：`cairn/rbac_decoupling_and_master_detail_center.md` 与交接文档 `docs/017_master_detail_role_center_and_tree_permissions.md`。

## 2026-08-20 · 环境依赖与子代理鉴权准则沉淀

- 确认并复盘本地 Docker MySQL 依赖中断与浏览器子代理无法获取 OA SSO 管理权限的问题。
- 确立环境依赖即时提示原则与强鉴权页面测试规范，避免静默重试。
- 详见主题笔记：`cairn/local_dev_and_subagent_testing_reflex.md`。

## 2026-08-20 · Project Cairn 初始化

- 初始化 Project Cairn 知识结构与规范配置。
- 迁移策略: `start_fresh`，语言: `zh`。
- 详见 `AGENTS.md`、`.cairn/config.yaml`。
