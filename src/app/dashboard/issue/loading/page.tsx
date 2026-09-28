import { Skeleton } from "@/components/ui/skeleton";

export default function IssueLoading() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Skeleton className="h-6 w-48" />
      <div className="card p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}