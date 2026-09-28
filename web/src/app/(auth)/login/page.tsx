"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, LogIn } from "lucide-react";
import { AuthShell } from "@/components/ui/auth-shell";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { GoogleButton, AuthDivider } from "@/components/ui/google-button";

const GOOGLE_ERRORS: Record<string, string> = {
  GOOGLE_NOT_CONFIGURED: "Google sign-in isn't configured on this server yet.",
  GOOGLE_FAILED: "Google sign-in failed. Please try again.",
  GOOGLE_DENIED: "Google sign-in was cancelled or blocked. Please try again.",
  GOOGLE_EMAIL_UNVERIFIED: "That Google account's email is not verified.",
  EMAIL_SEND_FAILED: "We couldn't email you a 6-digit code. Please try again later.",
};
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const googleError = GOOGLE_ERRORS[params.get("error") ?? ""];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "EMAIL_NOT_VERIFIED") {
          router.push(`/verify-email?email=${encodeURIComponent(data.email ?? email)}`);
          return;
        }
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.push(
        `/verify-login?token=${encodeURIComponent(data.challenge)}&email=${encodeURIComponent(email)}`
      );
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell icon={ShieldCheck} title="Welcome back" subtitle="Sign in to manage your certificates">
      <GoogleButton mode="login" />
      <AuthDivider />

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
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <PasswordInput
            id="password"
            placeholder="Your password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {(error || googleError) && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 animate-shake">
            {error || googleError}
          </div>
        )}

        <button type="submit" className="btn w-full" disabled={loading}>
          {loading ? <Spinner className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-center text-sm">
        <p className="text-slate-500">
          No account?{" "}
          <Link href="/signup" className="link">Create your organization</Link>
        </p>
        <p>
          <Link href="/forgot-password" className="link">Forgot your password?</Link>
        </p>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}