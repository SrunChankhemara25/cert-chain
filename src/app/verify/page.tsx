"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Search, QrCode, X } from "lucide-react";

const QrScanner = dynamic(() => import("@/components/QrScanner"), { ssr: false });

export default function VerifyPage() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [scanning, setScanning] = useState(false);

  const go = (value: string) => {
    const cleaned = value.trim().split("/").filter(Boolean).pop();
    if (cleaned) router.push(`/verify/${encodeURIComponent(cleaned)}`);
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 animate-slide-up sm:space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
          <Search className="h-6 w-6 text-brand-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Verify a Certificate</h1>
        <p className="text-sm text-slate-500">
          Enter a Certificate ID or scan the QR code printed on the certificate
        </p>
      </div>

      <div className="card space-y-5 p-5 sm:p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            go(id);
          }}
          className="space-y-3"
        >
          <label className="label" htmlFor="certId">Certificate ID</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="certId"
              className="input w-full font-mono"
              placeholder="CERT-2026-XXXXXXXX"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <button className="btn w-full shrink-0 sm:w-auto" type="submit">
              Verify
            </button>
          </div>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs uppercase tracking-wider text-slate-400">or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {scanning ? (
          <div className="space-y-3">
            <QrScanner onResult={go} />
            <button
              className="btn-outline w-full"
              onClick={() => setScanning(false)}
            >
              <X className="h-4 w-4" />
              Close scanner
            </button>
          </div>
        ) : (
          <button
            className="btn-outline w-full"
            onClick={() => setScanning(true)}
          >
            <QrCode className="h-4 w-4" />
            Scan QR code with camera
          </button>
        )}
      </div>
    </div>
  );
}