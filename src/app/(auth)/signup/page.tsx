"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { AuthShell } from "@/components/ui/auth-shell";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { GoogleButton, AuthDivider } from "@/components/ui/google-button";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      // Registration succeeded -> go verify the emailed code
      router.push(`/verify-email?email=${encodeURIComponent(data.email ?? form.email)}`);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      icon={UserPlus}
      title="Create your organization"
      subtitle="Start issuing blockchain-verified certificates"
    >
      {/* Google sign-up (creates the account instantly, no email code needed) */}
      <GoogleButton mode="signup" />
      <AuthDivider />

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="name">Organization name</label>
          <input
            id="name"
            className="input"
            placeholder="e.g. Acme Training Institute"
            required
            minLength={2}
            maxLength={100}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            placeholder="you@organization.com"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div>
          <label className="label" htmlFor="password">Password</label>
          <PasswordInput
            id="password"
            placeholder="8+ characters"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <div>
          <label className="label" htmlFor="confirm">Confirm password</label>
          <PasswordInput
            id="confirm"
            placeholder="Repeat your password"
            required
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 animate-shake">
            {error}
          </div>
        )}

        <button type="submit" className="btn w-full" disabled={loading}>
          {loading ? <Spinner className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="mt-5 border-t border-slate-100 pt-4 text-center text-sm">
        <p className="text-slate-500">
          Already registered?{" "}
          <Link href="/login" className="link">Sign in</Link>
        </p>
      </div>
    </AuthShell>
  );
}