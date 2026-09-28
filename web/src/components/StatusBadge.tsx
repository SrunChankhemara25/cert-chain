import { STATUS_STYLES } from "@/lib/status";

const DOT_COLORS: Record<string, string> = {
  VALID: "bg-green-500",
  EXPIRED: "bg-amber-500",
  REVOKED: "bg-red-500",
  NOT_FOUND: "bg-slate-400",
};

export default function StatusBadge({
  status,
  big = false,
}: {
  status: string;
  big?: boolean;
}) {
  const dot = DOT_COLORS[status] ?? DOT_COLORS.NOT_FOUND;

  if (big) {
    return (
      <span
        className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-base font-semibold sm:px-5 sm:text-lg ${
          STATUS_STYLES[status] ?? STATUS_STYLES.NOT_FOUND
        }`}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        {status.replace("_", " ")}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${
        STATUS_STYLES[status] ?? STATUS_STYLES.NOT_FOUND
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status.replace("_", " ")}
    </span>
  );
}