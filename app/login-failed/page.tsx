// app/login-failed/page.tsx
import Link from 'next/link';
import { ShieldAlert, RefreshCw, Eye, ArrowLeft } from 'lucide-react';

export default function LoginFailedPage() {
  return (
    <div className="relative min-h-screen text-slate-100 font-sans flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 -z-10 bg-[#07070a]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/20 via-zinc-950 to-black" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-red-500/5 rounded-full blur-[100px] -z-10" />

      {/* Card container */}
      <div className="w-full max-w-md p-8 rounded-2xl bg-gradient-to-br from-red-950/10 to-zinc-900/50 border border-red-500/20 shadow-2xl shadow-red-500/5 backdrop-blur-md text-center">
        {/* Warning Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-6 animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          单点登录 (SSO) 验证失败
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          无法通过致远 OA 完成身份鉴权校验
        </p>

        {/* Reasons block */}
        <div className="text-left rounded-xl bg-white/5 border border-white/5 p-4 mb-8 text-xs text-slate-400 space-y-2">
          <div className="font-semibold text-slate-300 mb-1">可能原因：</div>
          <div className="flex items-start gap-2">
            <span className="text-red-400">•</span>
            <span>致远 OA 单点登录 Ticket 无效或已被重复使用。</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-400">•</span>
            <span>门户与致远 OA 接口的网络握手请求超时。</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-400">•</span>
            <span>系统安全密钥 SHARED_JWT_SECRET 配置有误。</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <a
            href="https://oa.izpje.com/"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/10 hover:shadow-red-600/20 hover:-translate-y-0.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>重新登录致远 OA</span>
          </a>
          
          <Link
            href="/"
            className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
          >
            <Eye className="w-4 h-4" />
            <span>以演示模式浏览门户</span>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-xs text-slate-500 flex items-center justify-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>如有疑问请联系 IT 支持团队</span>
        </div>
      </div>
    </div>
  );
}
