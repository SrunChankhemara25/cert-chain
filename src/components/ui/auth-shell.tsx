import type { LucideIcon } from "lucide-react";

export function AuthShell({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5 animate-slide-up sm:space-y-6">
      {/* Icon + heading */}
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/25">
          <Icon className="h-7 w-7 text-white" />
        </div>
        <div className="space-y-1 px-2">
          <h1 className="text-[22px] font-bold leading-tight tracking-tight text-slate-900 sm:text-2xl">
            {title}
          </h1>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>

      {/* Card — even 20px rhythm inside; tighter outer padding on phones */}
      <div className="card space-y-5 p-5 sm:p-7">{children}</div>
    </div>
  );
}