import { Skeleton } from "@/components/ui/skeleton";

export default function BulkLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Skeleton className="h-6 w-56" />
      <div className="card p-6">
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}