"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

export default function RevokeButton({ certId }: { certId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function revoke() {
    if (reason.trim().length < 3) {
      toast.error("Please provide a reason (at least 3 characters).");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/certificates/${certId}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to revoke certificate.");
        return;
      }
      toast.success("Certificate revoked on-chain.");
      setOpen(false);
      setReason("");
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-danger-outline btn-sm"
      >
        <Ban className="h-3.5 w-3.5" />
        Revoke
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Revoke Certificate"
        description={certId}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Reason for revocation</label>
            <textarea
              className="input"
              rows={3}
              placeholder="e.g. Issued in error, recipient did not complete the course..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="form-hint">
              This will be shown publicly on the verification page.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-outline" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn-danger" onClick={revoke} disabled={busy}>
              {busy && <Spinner className="h-4 w-4" />}
              {busy ? "Revoking..." : "Revoke Certificate"}
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}