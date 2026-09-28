"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";

export default function LogoutButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <>
      <button className="btn-outline" onClick={() => setOpen(true)}>
        Logout
      </button>

      <Dialog
        open={open}
        onClose={() => !busy && setOpen(false)}
        title="Log out?"
        description="You will need to sign in again to access your organization dashboard."
      >
        {/* Stacked full-width buttons on phones (big tap targets), row from sm up */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="btn-outline w-full sm:w-auto"
            onClick={() => setOpen(false)}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            className="btn-danger w-full sm:w-auto"
            onClick={handleLogout}
            disabled={busy}
          >
            {busy ? "Logging out..." : "Log out"}
          </button>
        </div>
      </Dialog>
    </>
  );
}