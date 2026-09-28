"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MailCheck, ArrowLeft } from "lucide-react";
import { AuthShell } from "@/components/ui/auth-shell";
import { OtpInput } from "@/components/ui/otp-input";
import { ResendButton } from "@/components/ui/resend-button";
import { Spinner } from "@/components/ui/spinner";

function ForgotVerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed");
        setCode("");
        return;
      }
      router.push(`/reset-password?token=${encodeURIComponent(data.token)}`);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resend(): Promise<boolean> {
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not resend code");
        return false;
      }
      setCode("");
      return true;
    } catch {
      setError("Unable to reach the server. Please try again.");
      return false;
    }
  }

  if (!email) {
    return (
      <div className="card p-6 space-y-3 text-center animate-slide-up">
        <h1 className="text-xl font-bold text-slate-900">No reset request found</h1>
        <p className="text-sm text-slate-500">Please request a reset code first.</p>
        <Link href="/forgot-password" className="btn w-full">Request a reset code</Link>
      </div>
    );
  }

  return (
    <AuthShell
      icon={MailCheck}
      title="Check your email"
      subtitle={`Enter the 6-digit reset code sent to ${email}`}
    >
      <form onSubmit={submit} className="space-y-5">
        <OtpInput value={code} onChange={setCode} disabled={loading} />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 animate-shake">
            {error}
          </div>
        )}

        <button type="submit" className="btn w-full" disabled={loading || code.length !== 6}>
          {loading ? <Spinner className="h-4 w-4" /> : <MailCheck className="h-4 w-4" />}
          {loading ? "Verifying…" : "Verify code"}
        </button>
      </form>

      <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-center">
        <ResendButton onResend={resend} disabled={loading} />
        <p>
          <Link href="/forgot-password" className="link inline-flex items-center gap-1.5 text-sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Use a different email
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export default function ForgotVerifyPage() {
  return (
    <Suspense>
      <ForgotVerifyForm />
    </Suspense>
  );
}