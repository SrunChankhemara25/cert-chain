"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, ArrowLeft } from "lucide-react";
import { AuthShell } from "@/components/ui/auth-shell";
import { Spinner } from "@/components/ui/spinner";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not send the reset code");
        return;
      }
      // Step 1 done -> dedicated code verification page
      router.push(`/forgot-password/verify?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      icon={KeyRound}
      title="Forgot password"
      subtitle="We'll email you a 6-digit code to reset your password"
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            placeholder="you@organization.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="form-hint">Use the email your organization registered with.</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 animate-shake">
            {error}
          </div>
        )}

        <button type="submit" className="btn w-full" disabled={loading}>
          {loading ? <Spinner className="h-4 w-4" /> : null}
          {loading ? "Sending…" : "Send reset code"}
        </button>
      </form>

      <div className="mt-5 border-t border-slate-100 pt-4 text-center">
        <Link href="/login" className="link inline-flex items-center gap-1.5 text-sm">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </Link>
      </div>
    </AuthShell>
  );
}