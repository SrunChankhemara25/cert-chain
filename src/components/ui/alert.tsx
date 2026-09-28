import { AlertCircle, CheckCircle2, Info } from "lucide-react";

type AlertProps = {
  variant: "success" | "error" | "info" | "warning";
  title?: string;
  children: React.ReactNode;
};

const styles = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
};

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertCircle,
};

export function Alert({ variant, title, children }: AlertProps) {
  const Icon = icons[variant];
  return (
    <div className={`flex gap-3 rounded-xl border p-3.5 text-sm sm:p-4 ${styles[variant]}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        {title && <p className="mb-0.5 font-semibold">{title}</p>}
        <div className="break-words">{children}</div>
      </div>
    </div>
  );
}