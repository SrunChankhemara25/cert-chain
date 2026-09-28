"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { KeyRound, CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/ui/auth-shell";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) return setError("Passwords don't match");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Reset failed");
        return;
      }
      setDone(true);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card p-6 space-y-4 text-center animate-scale-in">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900">Password updated</h1>
          <p className="text-sm text-slate-500">You can now sign in with your new password.</p>
        </div>
        <button className="btn w-full" onClick={() => router.push("/login")}>Go to login</button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="card p-6 space-y-4 text-center animate-slide-up">
        <h1 className="text-xl font-bold text-slate-900">No reset session found</h1>
        <p className="text-sm text-slate-500">
          Request a reset code and verify it first — you'll be brought back here
          to choose a new password.
        </p>
        <Link href="/forgot-password" className="btn w-full">Request a reset code</Link>
      </div>
    );
  }

  return (
    <AuthShell
      icon={KeyRound}
      title="Choose a new password"
      subtitle="Code verified — now set your new password"
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="new">New password</label>
          <PasswordInput
            id="new"
            placeholder="8+ characters"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="confirm">Confirm new password</label>
          <PasswordInput
            id="confirm"
            placeholder="Repeat new password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 animate-shake">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn w-full"
          disabled={loading || !newPassword || !confirmPassword}
        >
          {loading ? <Spinner className="h-4 w-4" /> : null}
          {loading ? "Resetting…" : "Reset password"}
        </button>
      </form>

      <div className="mt-5 border-t border-slate-100 pt-4 text-center">
        <Link href="/forgot-password" className="link text-sm">
          Start over with a different email
        </Link>
      </div>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}