"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ExternalLink, Download, Eye } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import RevokeButton from "@/components/RevokeButton";
// DEMO: real version imports explorerTxUrl from "@/lib/blockchain" (backend file)
const explorerTxUrl = (_tx: string): string | null => null;
import { fmtDayISO } from "@/lib/datetime";

type CertRow = {
  id: string;
  certId: string;
  recipientName: string;
  recipientEmail: string;
  courseTitle: string;
  issueDate: Date;
  expiryDate: Date | null;
  txHash: string;
  status: string;
  display: string;
};

function ChainLink({ txHash }: { txHash: string }) {
  const url = explorerTxUrl(txHash);
  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
    >
      View tx
      <ExternalLink className="h-3 w-3" />
    </a>
  ) : (
    <span className="text-xs text-slate-400">Local net</span>
  );
}

function RowActions({ r }: { r: CertRow }) {
  return (
    <div className="flex items-center gap-1.5">
      <a href={`/api/certificates/${r.certId}/pdf`} className="btn-ghost btn-sm" title="Download PDF">
        <Download className="h-3.5 w-3.5" />
      </a>
      <Link href={`/verify/${r.certId}`} className="btn-ghost btn-sm" title="View public verification">
        <Eye className="h-3.5 w-3.5" />
      </Link>
      {r.status === "active" && <RevokeButton certId={r.certId} />}
    </div>
  );
}

export default function DashboardTable({ certificates }: { certificates: CertRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = useMemo(() => {
    return certificates.filter((r) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        r.recipientName.toLowerCase().includes(q) ||
        r.certId.toLowerCase().includes(q) ||
        r.courseTitle.toLowerCase().includes(q) ||
        r.recipientEmail.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "ALL" || r.display === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [certificates, search, statusFilter]);

  const tabs = ["ALL", "VALID", "EXPIRED", "REVOKED"];

  return (
    <div className="card overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
        <div className="relative sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input h-9 pl-9"
            placeholder="Search by name, ID, course, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === tab
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 📱 Phones: one card per certificate (no horizontal scrolling) */}
      <ul className="divide-y divide-slate-100 lg:hidden">
        {filtered.length === 0 && (
          <li className="px-4 py-12 text-center text-sm text-slate-500">
            No certificates match your search.
          </li>
        )}
        {filtered.map((r) => (
          <li key={r.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{r.courseTitle}</p>
                <p className="mt-0.5 break-all font-mono text-xs text-slate-400">{r.certId}</p>
              </div>
              <StatusBadge status={r.display} />
            </div>

            <div className="space-y-1 text-xs text-slate-700">
              <p>
                <span className="text-slate-400">Recipient: </span>
                {r.recipientName}
                <span className="block break-all text-slate-400">{r.recipientEmail}</span>
              </p>
              <p>
                <span className="text-slate-400">Issued: </span>
                {fmtDayISO(r.issueDate)}
                <span className="text-slate-400"> · Expires: </span>
                {fmtDayISO(r.expiryDate)}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2">
              <ChainLink txHash={r.txHash} />
              <RowActions r={r} />
            </div>
          </li>
        ))}
      </ul>

      {/* 💻 Tablet & laptop: full table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {["Certificate", "Recipient", "Issued", "Expires", "Status", "Chain", "Actions"].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                  No certificates match your search.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-slate-900">{r.courseTitle}</p>
                  <p className="mt-0.5 font-mono text-xs text-slate-400">{r.certId}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-slate-900">{r.recipientName}</p>
                  <p className="text-xs text-slate-400">{r.recipientEmail}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{fmtDayISO(r.issueDate)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{fmtDayISO(r.expiryDate)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.display} />
                </td>
                <td className="px-4 py-3">
                  <ChainLink txHash={r.txHash} />
                </td>
                <td className="px-4 py-3">
                  <RowActions r={r} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
        Showing {filtered.length} of {certificates.length} certificates
      </div>
    </div>
  );
}