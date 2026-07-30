# 开发总结：Omni 统一门户 MVP 搭建与 SSO 握手校验实现

- **归档日期**：2026-07-28
- **涉及模块/文件**：
  - [proxy.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/proxy.ts)
  - [app/page.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/page.tsx)
  - [app/Dashboard.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/Dashboard.tsx)
  - [app/login-failed/page.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/login-failed/page.tsx)
  - [app/api/sso/seeyon/route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/sso/seeyon/route.ts)
  - [docs/child-app-middleware-template.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/docs/child-app-middleware-template.ts)
  - [.env.example](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/.env.example)
  - [.env](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/.env)
- **阶段状态**：已完成

---

## 1. 本阶段完成工作 (What Was Done)

- **脚手架搭建**：使用 `create-next-app` 初始化了 TypeScript + Tailwind CSS (v4) + App Router 的 Next.js 16 项目，并安装了安全库 `jose` 与图标库 `lucide-react`。
- **配置与环境文件**：编写了 `.env.example` 和 `.env` 开发环境文件，配置了用于 JWT 加密的共享密钥 `SHARED_JWT_SECRET`，致远 OA 验证主机 `SEEYON_OA_HOST`，以及跨域 Cookie 域名 `COOKIE_DOMAIN`。
- **单点登录 (SSO) 路由**：实现 `app/api/sso/seeyon/route.ts` 接口，接收 URL query 参数 `ticket` 并向致远 OA 发起握手验证。支持从 HTTP Header 或响应 Body (包含 JSON, 纯文本, XML) 自动解析登录账号名，验证通过后签发包含 8 小时有效期的 JWT Cookie，并重定向至门户首页。
- **路由守护与身份注入**：遵循 Next.js 16 的最新规范，在项目根目录下实现 `proxy.ts`（替代已弃用的 `middleware.ts` 命名规则），解析并校验 `token` Cookie。若有效则向请求头注入 `x-user-id` 用户名，无效或不存在则注入 `guest`（游客）。
- **高保真企业级工作台首页**：
  - 设计了 Server-Side 渲染的 `app/page.tsx` 与 Client-Side 状态驱动的 `app/Dashboard.tsx`，将 `x-user-id` 由服务端传递至客户端。
  - 采用现代磨砂玻璃质感（Glassmorphism）和渐变暗黑风格，包含高亮运行状态指示灯、检索过滤功能以及 5 大数字化应用的统一导航。
  - 实现了精美的 `/login-failed` 验证失败页，提供错误引导及一键重新登录/游客浏览选项。
- **子应用接入模板**：编写了 `docs/child-app-middleware-template.ts`，为 WeldSnap、FabFlow 等子系统提供现成可复制的 SSO 拦截代码，并对 Next.js 新旧版本（Middleware/Proxy 机制）进行了向下兼容性说明。

## 2. 核心架构与实现细节 (Technical Decisions)

- **Edge Runtime 兼容性**：选用 `jose` 而非传统的 `jsonwebtoken`，因为 `jose` 底层基于 Web Cryptography API，能完美契合 Next.js 的 Edge runtime 并在 `proxy.ts` (Middleware) 中高效处理加解密。
- **SSO 兼容度优化**：致远 OA 的 `thirdpartyController` 接口可能返回 JSON、XML 或普通文本格式。在 SSO 接口实现中设计了多重解析逻辑（Header -> Body JSON -> XML正则匹配 -> Trim 文本），保障了验证通道的极端稳定性。
- **无感单点登录方案**：JWT Cookie 的 domain 强制设为 `.izpje.com`，这允许所有子域应用（如 `docex.izpje.com`, `weldsnap.izpje.com`）直接在浏览器端共享该 Cookie，实现免去重定向的完全无感登录。

## 3. 踩坑经验与避坑指南 (Pitfalls & Gotchas)

- **遇到问题**：使用 `create-next-app` 初始化项目时，npm 命名规则要求包名全部小写，而我们的当前工作目录是 `Omni` (首字母大写)，这导致直接在当前文件夹下初始化报错。
- **解决方案**：在临时目录 `omni-portal` 中完成初始化，然后再利用 Powershell 将所有依赖与代码移动到当前工作目录，清理临时文件夹。
- **遇到问题**：Next.js 16 抛出了警告：`The "middleware" file convention is deprecated. Please use "proxy" instead.`。
- **解决方案**：阅读内置 API 文档 `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`，获知 Next.js 16 已将中间件规范重命名为 `proxy.ts`，导出的函数也由 `middleware` 重命名为 `proxy`。已将原代码升级并删除了旧文件，使项目完美通过了 `pnpm build` 的零警告编译。

## 4. 下一步交接指引 (Handover Notes)

- [ ] 联调真实的致远 OA 服务器：确保 `.env` 中的 `SEEYON_OA_HOST` 设置为真实的联调地址，并使用真实生成的 `ticket` 测试握手解析过程。
- [ ] 配置生产环境域名 DNS：将 `omni.izpje.com` 解析到部署的主机上。

- **关联依赖**：
  - 接手开发者应先查阅 [000_Omni Setup.md](<file:///c:/Users/gaoft/Documents/CodeSpace/Omni/docs/000_Omni%20Setup.md>) 了解业务蓝图。
  - 本地运行命令：运行 `pnpm dev` 启动开发服务器。
