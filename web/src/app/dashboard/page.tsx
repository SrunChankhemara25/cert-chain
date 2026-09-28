import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { FileText, Award, CheckCircle2, Clock, Ban } from "lucide-react";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getDisplayStatus } from "@/lib/status";
import { EmptyState } from "@/components/ui/empty-state";
import DashboardTable from "./dashboard-table";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = (await getSession())!;
  const rows = await db
    .select()
    .from(certificates)
    .where(eq(certificates.orgId, session.orgId))
    .orderBy(desc(certificates.createdAt));

  const withStatus = rows.map((r) => ({ ...r, display: getDisplayStatus(r) }));

  const stats = [
    { label: "Total issued", value: withStatus.length, icon: Award, color: "text-brand-600 bg-brand-50" },
    { label: "Valid", value: withStatus.filter((r) => r.display === "VALID").length, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
    { label: "Expired", value: withStatus.filter((r) => r.display === "EXPIRED").length, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Revoked", value: withStatus.filter((r) => r.display === "REVOKED").length, icon: Ban, color: "text-red-600 bg-red-50" },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Stats: 2×2 on phones, 4-across from md */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card flex items-center gap-3 p-3 sm:p-4">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${s.color}`}>
              <s.icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-slate-900 sm:text-2xl">{s.value}</p>
              <p className="truncate text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table / cards */}
      {withStatus.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FileText}
            title="No certificates yet"
            description="Issue your first certificate to get started. It will be recorded on the blockchain and emailed to the recipient."
            action={
              <Link href="/dashboard/issue" className="btn w-full sm:w-auto">
                Issue Certificate
              </Link>
            }
          />
        </div>
      ) : (
        <DashboardTable certificates={withStatus} />
      )}
    </div>
  );
}