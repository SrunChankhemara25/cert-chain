"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/ui/auth-shell";
import { OtpInput } from "@/components/ui/otp-input";
import { ResendButton } from "@/components/ui/resend-button";
import { Spinner } from "@/components/ui/spinner";

function VerifyLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [token, setToken] = useState(params.get("token") ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge: token, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed");
        setCode("");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resend(): Promise<boolean> {
    setError("");
    try {
      const res = await fetch("/api/auth/resend-login-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge: token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not resend code");
        return false;
      }
      setToken(data.challenge); // fresh challenge = fresh code + fresh countdown
      setCode("");
      return true;
    } catch {
      setError("Unable to reach the server. Please try again.");
      return false;
    }
  }

  if (!token) {
    return (
      <div className="card p-6 space-y-3 text-center animate-slide-up">
        <h1 className="text-xl font-bold text-slate-900">No verification session</h1>
        <p className="text-sm text-slate-500">Please log in with your password first.</p>
        <button className="btn w-full" onClick={() => router.push("/login")}>
          Go to login
        </button>
      </div>
    );
  }

  return (
    <AuthShell
      icon={ShieldCheck}
      title="Two-step verification"
      subtitle={`We sent a 6-digit verification code to ${email || "your email"}`}
    >
      <form onSubmit={submit} className="space-y-5">
        <OtpInput value={code} onChange={setCode} disabled={loading} />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 animate-shake">
            {error}
          </div>
        )}

        <button type="submit" className="btn w-full" disabled={loading || code.length !== 6}>
          {loading ? <Spinner className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          {loading ? "Verifying…" : "Verify & sign in"}
        </button>
      </form>

      <div className="mt-5 border-t border-slate-100 pt-4 text-center">
        <ResendButton onResend={resend} disabled={loading} initialSeconds={30} />
      </div>
    </AuthShell>
  );
}

export default function VerifyLoginPage() {
  return (
    <Suspense>
      <VerifyLoginForm />
    </Suspense>
  );
}