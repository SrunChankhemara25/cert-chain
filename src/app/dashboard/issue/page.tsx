"use client";

import { useState } from "react";
import Link from "next/link";
import { FilePlus2, CheckCircle2, ExternalLink } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { tomorrowISO } from "@/lib/datetime";

export default function IssuePage() {
  const empty = {
    recipientName: "",
    recipientEmail: "",
    courseTitle: "",
    description: "",
    expiryDate: "",
  };
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ certId: string; txHash: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDone(null);
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to issue certificate");
        return;
      }
      setDone(data.certificate);
      setForm(empty);
      toast.success("Certificate issued and emailed!");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const set =
    (k: keyof typeof empty) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  if (done) {
    return (
      <div className="card mx-auto max-w-lg space-y-4 p-6 text-center animate-slide-up sm:p-8">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
        <h1 className="text-xl font-bold text-slate-900">Certificate issued!</h1>
        <p className="text-sm text-slate-500">
          The certificate has been written to the blockchain and emailed to the recipient.
        </p>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="mb-1 text-xs text-slate-500">Certificate ID</p>
          <p className="break-all font-mono font-semibold text-slate-900">{done.certId}</p>
        </div>
        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          <Link href={`/verify/${done.certId}`} className="btn w-full sm:w-auto">
            View verification page
            <ExternalLink className="h-4 w-4" />
          </Link>
          <button className="btn-outline w-full sm:w-auto" onClick={() => setDone(null)}>
            Issue another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 animate-slide-up sm:space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">Issue a Certificate</h1>
        <p className="text-sm text-slate-500">
          The certificate will be recorded on the blockchain and emailed to the recipient.
        </p>
      </div>

      <div className="card p-5 sm:p-6">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="recipientName">Recipient name</label>
              <input
                id="recipientName"
                className="input"
                placeholder="Full name"
                required
                minLength={2}
                maxLength={100}
                value={form.recipientName}
                onChange={set("recipientName")}
              />
            </div>
            <div>
              <label className="label" htmlFor="recipientEmail">Recipient email</label>
              <input
                id="recipientEmail"
                className="input"
                type="email"
                placeholder="recipient@email.com"
                required
                value={form.recipientEmail}
                onChange={set("recipientEmail")}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="courseTitle">Course / achievement title</label>
            <input
              id="courseTitle"
              className="input"
              placeholder="e.g. Advanced Blockchain Development"
              required
              minLength={2}
              maxLength={150}
              value={form.courseTitle}
              onChange={set("courseTitle")}
            />
          </div>

          <div>
            <label className="label" htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              className="input"
              placeholder="Brief description of the achievement..."
              rows={3}
              maxLength={500}
              value={form.description}
              onChange={set("description")}
            />
          </div>

          <div>
            <label className="label" htmlFor="expiryDate">Expiry date</label>
            <input
              id="expiryDate"
              className="input"
              type="date"
              min={tomorrowISO()}
              value={form.expiryDate}
              onChange={set("expiryDate")}
            />
            <p className="form-hint">Leave empty for no expiry. Must be at least tomorrow.</p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 animate-shake">
              {error}
            </div>
          )}

          <button className="btn w-full" disabled={loading}>
            {loading ? (
              <>
                <Spinner className="h-4 w-4" />
                <span>
                  Writing to blockchain...
                  <span className="hidden sm:inline"> (15–30s)</span>
                </span>
              </>
            ) : (
              <>
                <FilePlus2 className="h-4 w-4" />
                Issue Certificate
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}