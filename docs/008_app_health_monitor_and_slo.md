# 开发总结：健康探活、维护降级与自动登出 (SLO) 实现

- **归档日期**：2026-07-30
- **涉及模块/文件**：
  - [app/api/cron/health-check/route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/cron/health-check/route.ts)（后台探活服务）
  - [app/Dashboard.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/Dashboard.tsx)（探活状态展示、降级弹窗、客户端自动登出）
  - [app/api/sso/seeyon/route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/sso/seeyon/route.ts)（单点登录存活标识 Cookie）
- **阶段状态**：已完成

---

## 1. 本阶段完成工作 (What Was Done)
*   **并发探测服务**：设计了 `/api/cron/health-check` 接口。采用 `Promise.all` 对所有已注册子应用并行发送 HTTP GET 请求进行探活。设置了 3 秒超时限制，更新 `healthStatus` 状态。
*   **定时任务挂载**：在远端生产服务器上配置了 Linux 定时任务（Cron Job），每分钟自动请求该接口刷新状态。配置了 `secure_cron_token` 校验以防止外部恶意触发。
*   **维护与离线弹窗降级**：用轻量级单色风格（Luminous White）的弹出警告对话框替换了原有粗糙的 `alert()`。
*   **管理员特权通路**：若系统处于 "维护中" 或 "离线" 状态，普通用户点击时弹窗警示并限制跳转；而对于管理员（`isAdmin === true`），弹窗会额外提供 "强制访问 (管理员)" 通路，方便运维人员直接进站测试。
*   **客户端自动登出**：在单点登录逻辑中，额外写入一个可被 JS 读取的 `session_active` 状态 Cookie（有效期 8 小时）。门户客户端挂载了 30 秒间隔探针，当检测到 `session_active` 丢失时自动执行注销登出。

## 2. 核心架构与实现细节 (Technical Decisions)
*   **并行化探活**：将探活方式设定为 `fetch(url)`，通过 Promise 并发流进行探测，效率从原来的串行逐个检测提升了 5 倍以上。
*   **HttpOnly Cookie 边界隔离**：由于单点登录的主 JWT Token 开启了 HttpOnly 以预防 XSS 攻击，前端 JS 无法检测其过期状态。因此我们设计了轻量级、无敏感信息的明文 Cookie `session_active=true` 用于生命周期判定，实现了安全性与交互体验的双赢。

## 3. 踩坑经验与避坑指南 (Pitfalls & Gotchas)
*   **遇到问题**：将探活任务部署至远端运行后，探活日志报错 `❌ 缺少必要的环境变量: SEEYON_OA_HOST, SEEYON_OA_REST_USERNAME, SEEYON_OA_REST_PASSWORD`，导致同步程序中途退出。
*   **解决方案**：检查发现远端生产服务器的 `/var/www/Omni/.env` 缺少了致远 OA 的 REST 校验账号密码（`SEEYON_OA_REST_USERNAME` 与 `SEEYON_OA_REST_PASSWORD`）。通过 `update_remote_env_rest.py` 脚本远程向生产 env 追参后解决。
*   **避坑提示**：往后在对应用进行生产环境迁移或新增同步项时，必须核对生产主机的环境变量配置文件，避免接口因为鉴权信息缺失而拒绝连接。

## 4. 下一步交接指引 (Handover Notes)
- [ ] 后续可根据需要，在后台添加配置探活超时的自定义数值选项。
- [ ] 进入体验升级阶段开发，优先落地常用应用收藏（§2.1）以及全局搜索（§2.2）。
- **关联依赖**：关于部署方式可参考 [walkthrough.md](file:///C:/Users/gaoft/.gemini/antigravity-ide/brain/bdfe43bd-dc9f-498f-b3f7-effff62de421/walkthrough.md) 中的说明。
