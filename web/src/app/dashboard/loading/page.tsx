import { StatsSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <StatsSkeleton />
      <div className="card">
        <div className="p-4 border-b border-slate-100">
          <div className="animate-pulse h-4 w-32 bg-slate-200 rounded" />
        </div>
        <TableSkeleton rows={6} />
      </div>
    </div>
  );
}