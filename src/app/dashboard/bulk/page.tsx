"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Row = {
  recipientName: string;
  recipientEmail: string;
  courseTitle: string;
  expiryDate: string;
};

type LogEntry = {
  index: number;
  name: string;
  result: "pending" | "ok" | "fail";
  detail: string;
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseCsv(text: string): Row[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];
  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const hasHeader = header.includes("name") || header.includes("email");
  const body = hasHeader ? lines.slice(1) : lines;
  return body
    .map((l) => parseCsvLine(l))
    .filter((c) => c.length >= 3 && c[0] && c[1] && c[2])
    .map(([recipientName, recipientEmail, courseTitle, expiryDate = ""]) => ({
      recipientName,
      recipientEmail,
      courseTitle,
      expiryDate,
    }));
}

export default function BulkPage() {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Stop the browser from opening files dropped anywhere on the page
  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ""; // allows picking the same file again later
  }

  async function handleFile(file: File) {
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      toast.error("Please use a .csv file.");
      return;
    }
    setFileName(file.name);
    const rows = parseCsv(await file.text());
    if (rows.length === 0) {
      toast.error("No rows found in the CSV file.");
      return;
    }

    setRunning(true);
    setLog(
      rows.map((r, i) => ({
        index: i + 1,
        name: r.recipientName,
        result: "pending",
        detail: "Waiting...",
      }))
    );

    for (const [i, row] of rows.entries()) {
      try {
        const res = await fetch("/api/certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row),
        });
        const data = await res.json();
        setLog((l) =>
          l.map((entry, idx) =>
            idx === i
              ? {
                  ...entry,
                  result: res.ok ? "ok" : "fail",
                  detail: res.ok ? data.certificate.certId : data.error,
                }
              : entry
          )
        );
      } catch {
        setLog((l) =>
          l.map((entry, idx) =>
            idx === i ? { ...entry, result: "fail", detail: "Network error" } : entry
          )
        );
      }
    }
    setRunning(false);
    toast.success("Bulk issuance complete.");
  }

  const okCount = log.filter((l) => l.result === "ok").length;
  const failCount = log.filter((l) => l.result === "fail").length;

  return (
    <div className="mx-auto max-w-2xl space-y-5 animate-slide-up sm:space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">Bulk Issue from CSV</h1>
        <p className="text-sm text-slate-500">
          Upload a CSV file to issue certificates for an entire class or cohort.
        </p>
      </div>

      <div className="card space-y-4 p-4 sm:p-6">
        {/* Upload area */}
        <div
          className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors sm:p-8 ${
            dragging
              ? "border-blue-500 bg-blue-50"
              : "border-slate-300 hover:border-blue-400 hover:bg-blue-50/40"
          } ${running ? "pointer-events-none opacity-60" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!running) setDragging(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (running) return;
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
        >
          <Upload
            className={`mx-auto mb-3 h-8 w-8 transition-colors ${
              dragging ? "text-blue-600" : "text-slate-400"
            }`}
          />
          <p className="text-sm font-medium text-slate-700">
            {dragging
              ? "Drop the file to upload"
              : fileName || "Click to upload — or drag & drop a CSV here"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Header row:{" "}
            <code className="break-all rounded bg-slate-100 px-1.5 py-0.5">
              name,email,course,expiryDate
            </code>
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            onChange={onFile}
            disabled={running}
            className="hidden"
          />
        </div>

        {/* Progress */}
        {log.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate text-slate-600">
                {running ? "Processing..." : "Complete"} — {okCount} issued, {failCount} failed
              </span>
              {running && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-600" />}
            </div>

            <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
              {log.map((entry) => (
                <div
                  key={entry.index}
                  className="flex flex-col gap-1 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:gap-3"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    {entry.result === "ok" && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    )}
                    {entry.result === "fail" && (
                      <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                    )}
                    {entry.result === "pending" && (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-300" />
                    )}
                    <span className="truncate font-medium text-slate-700">
                      {entry.index}. {entry.name}
                    </span>
                  </span>
                  <span
                    className={`break-all font-mono text-xs sm:ml-auto sm:text-right ${
                      entry.result === "ok"
                        ? "text-green-600"
                        : entry.result === "fail"
                        ? "text-red-600"
                        : "text-slate-400"
                    }`}
                  >
                    {entry.detail}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}