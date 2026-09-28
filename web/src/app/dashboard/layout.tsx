import Link from "next/link";
import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import { LayoutDashboard, FilePlus2, Files, ShieldCheck } from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Signed in as</p>
            <p className="truncate font-semibold text-slate-900">{session?.name}</p>
          </div>
        </div>

        {/* 2×2 grid on phones, single row from sm up */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Link href="/dashboard" className="btn-outline btn-sm w-full justify-center sm:w-auto">
            <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
            Certificates
          </Link>
          <Link href="/dashboard/issue" className="btn btn-sm w-full justify-center sm:w-auto">
            <FilePlus2 className="h-3.5 w-3.5 shrink-0" />
            Issue
          </Link>
          <Link href="/dashboard/bulk" className="btn-outline btn-sm w-full justify-center sm:w-auto">
            <Files className="h-3.5 w-3.5 shrink-0" />
            Bulk (CSV)
          </Link>
          {/* full-width row on phones whatever LogoutButton renders */}
          <div className="col-span-2 [&>button]:w-full sm:col-span-1 sm:[&>button]:w-auto">
            <LogoutButton />
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}