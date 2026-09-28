import Link from "next/link";
import { FileText, Award, CheckCircle2, Clock, Ban } from "lucide-react";
import { getDisplayStatus } from "@/lib/status";
import { EmptyState } from "@/components/ui/empty-state";
import DashboardTable from "./dashboard-table";

// DEMO DATA: replaces the database query so the dashboard UI can be viewed
// without a backend. Delete this and restore the real query when connected.
const d = (days: number) => new Date(Date.now() + days * 86400000);
const rows = [
  { id: "1", certId: "CERT-2026-0001", recipientName: "Sokha Chan", recipientEmail: "sokha@example.com", courseTitle: "Blockchain Fundamentals", issueDate: d(-30), expiryDate: d(335), txHash: "0xdemo0001", status: "active" as const },
  { id: "2", certId: "CERT-2026-0002", recipientName: "Dara Kim", recipientEmail: "dara@example.com", courseTitle: "Web Development Bootcamp", issueDate: d(-90), expiryDate: d(-5), txHash: "0xdemo0002", status: "active" as const },
  { id: "3", certId: "CERT-2026-0003", recipientName: "Vanna Sok", recipientEmail: "vanna@example.com", courseTitle: "Cybersecurity Basics", issueDate: d(-60), expiryDate: null, txHash: "0xdemo0003", status: "revoked" as const },
  { id: "4", certId: "CERT-2026-0004", recipientName: "Rithy Ly", recipientEmail: "rithy@example.com", courseTitle: "Data Analysis with Python", issueDate: d(-10), expiryDate: d(355), txHash: "0xdemo0004", status: "active" as const },
];

export default function DashboardPage() {
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