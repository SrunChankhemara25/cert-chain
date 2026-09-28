import Link from "next/link";
import { AlertTriangle, CheckCircle2, ExternalLink, ArrowLeft, FileText, Link2 } from "lucide-react";
import { getVerification } from "@/lib/verification";
import { explorerAddressUrl, explorerTxUrl } from "@/lib/blockchain";
import StatusBadge from "@/components/StatusBadge";
import { Alert } from "@/components/ui/alert";
import { fmtDay, fmtUnixDateTime } from "@/lib/datetime";

export const dynamic = "force-dynamic";

const fmt = (d: Date | null) => fmtDay(d);
const fmtUnix = (n: number) => fmtUnixDateTime(n);

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-x-4 gap-y-1 py-2.5 text-sm sm:grid-cols-3 sm:items-baseline border-b border-slate-100 last:border-0">
      <dt className="text-xs font-medium text-slate-500 sm:text-sm">{label}</dt>
      <dd className="col-span-2 break-all text-slate-900">{children}</dd>
    </div>
  );
}

export default async function VerifyResultPage({
  params,
}: {
  params: { certId: string };
}) {
  const certId = decodeURIComponent(params.certId);
  const v = await getVerification(certId);

  if (!v.found) {
    return (
      <div className="mx-auto max-w-xl space-y-4 animate-slide-up">
        <div className="card space-y-4 p-6 text-center sm:p-8">
          <StatusBadge status="NOT_FOUND" big />
          <p className="text-slate-600">
            No certificate with ID{" "}
            <span className="break-all font-mono font-medium">{certId}</span> exists.
          </p>
          {v.chainError && (
            <Alert variant="error" title="Blockchain error">
              {v.chainError}
            </Alert>
          )}
          <Link href="/verify" className="btn-outline w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4" />
            Try another ID
          </Link>
        </div>
      </div>
    );
  }

  const c = v.certificate;
  const ch = v.chain;

  return (
    <div className="mx-auto max-w-2xl space-y-4 animate-slide-up sm:space-y-5">
      {/* Status banner */}
      <div className="card space-y-3 p-5 text-center sm:p-6">
        <StatusBadge status={v.status} big />
        <p className="mx-auto max-w-md text-sm text-slate-600">
          {v.status === "VALID" && "This certificate is authentic and currently valid."}
          {v.status === "EXPIRED" && "This certificate is authentic but has passed its expiry date."}
          {v.status === "REVOKED" && "This certificate was revoked by the issuing organization."}
        </p>
      </div>

      {/* DB row exists but the blockchain has no proof for it */}
      {c && !ch && (
        <Alert variant="warning" title="No on-chain record found">
          This certificate exists in the database, but the blockchain returned no record for
          it. On a local Hardhat network this happens when the node is restarted or the
          contract is redeployed — the on-chain proof is lost while the database row remains.
          {v.chainError ? ` (Blockchain error: ${v.chainError})` : ""}
        </Alert>
      )}

      {/* Integrity check */}
      {v.integrityOk === false && (
        <Alert variant="error" title="Integrity warning">
          The stored certificate data does <b>NOT</b> match the fingerprint on the blockchain.
          The record may have been tampered with.
        </Alert>
      )}
      {v.integrityOk === true && (
        <Alert variant="success" title="Integrity check passed">
          The certificate data matches its on-chain fingerprint.
        </Alert>
      )}

      {/* Certificate info */}
      {c && (
        <div className="card p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Certificate information</h2>
          </div>
          <dl>
            <Row label="Certificate ID">
              <span className="break-all rounded bg-slate-100 px-2 py-0.5 font-mono text-xs">
                {c.certId}
              </span>
            </Row>
            <Row label="Recipient">{c.recipientName}</Row>
            <Row label="Course / achievement">{c.courseTitle}</Row>
            {c.description && <Row label="Description">{c.description}</Row>}
            <Row label="Issued by">{c.orgName}</Row>
            <Row label="Issue date">{fmt(c.issueDate)}</Row>
            <Row label="Expiry date">{fmt(c.expiryDate)}</Row>
            {ch?.revokedAt ? (
              <Row label="Revoked">
                {fmtUnix(ch.revokedAt)} — {ch.revokeReason}
              </Row>
            ) : null}
          </dl>
        </div>
      )}

      {/* Blockchain info */}
      {ch && (
        <div className="card p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Blockchain information</h2>
          </div>
          <dl>
            <Row label="Network">{process.env.NEXT_PUBLIC_CHAIN_NAME}</Row>
            {c && (
              <Row label="Issue transaction">
                {explorerTxUrl(c.txHash) ? (
                  <a
                    className="inline-flex items-center gap-1 font-mono text-xs text-brand-600 hover:text-brand-700 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                    href={explorerTxUrl(c.txHash)!}
                  >
                    <span className="break-all">{c.txHash.slice(0, 18)}...{c.txHash.slice(-8)}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : (
                  <span className="break-all font-mono text-xs">{c.txHash}</span>
                )}
              </Row>
            )}
            {c?.blockNumber && <Row label="Block number">{c.blockNumber}</Row>}
            {c?.revokeTxHash && (
              <Row label="Revoke transaction">
                {explorerTxUrl(c.revokeTxHash) ? (
                  <a
                    className="inline-flex items-center gap-1 font-mono text-xs text-brand-600 hover:text-brand-700 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                    href={explorerTxUrl(c.revokeTxHash)!}
                  >
                    <span className="break-all">{c.revokeTxHash.slice(0, 18)}...{c.revokeTxHash.slice(-8)}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : (
                  <span className="break-all font-mono text-xs">{c.revokeTxHash}</span>
                )}
              </Row>
            )}
            <Row label="Data hash (SHA-256)">
              <span className="break-all font-mono text-xs">{ch.dataHash}</span>
            </Row>
            <Row label="Issuer wallet">
              {explorerAddressUrl(ch.issuer) ? (
                <a
                  className="inline-flex items-center gap-1 font-mono text-xs text-brand-600 hover:text-brand-700 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                  href={explorerAddressUrl(ch.issuer)!}
                >
                  <span className="break-all">{ch.issuer.slice(0, 10)}...{ch.issuer.slice(-8)}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : (
                <span className="break-all font-mono text-xs">{ch.issuer}</span>
              )}
            </Row>
            <Row label="Recorded on-chain">{fmtUnix(ch.issuedAt)}</Row>
          </dl>
        </div>
      )}

      <div className="text-center">
        <Link href="/verify" className="btn-outline w-full sm:w-auto">
          <ArrowLeft className="h-4 w-4" />
          Verify another certificate
        </Link>
      </div>
    </div>
  );
}