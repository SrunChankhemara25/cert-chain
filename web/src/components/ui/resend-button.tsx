"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

type ResendButtonProps = {
  /** Return true when the new code was sent (restarts the countdown). */
  onResend: () => Promise<boolean>;
  initialSeconds?: number;
  disabled?: boolean;
};

export function ResendButton({
  onResend,
  initialSeconds = 60,
  disabled = false,
}: ResendButtonProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  async function click() {
    setBusy(true);
    const ok = await onResend();
    setBusy(false);
    if (ok) setSecondsLeft(initialSeconds);
  }

  const cooling = secondsLeft > 0;
  const label = `${Math.floor(secondsLeft / 60)}:${(secondsLeft % 60)
    .toString()
    .padStart(2, "0")}`;

  return (
    <button
      type="button"
      // Added py-2 px-1 to ensure the tap target is large enough on mobile even if the text is small
      className="link inline-flex items-center gap-1.5 rounded-md py-2 px-1 text-sm disabled:opacity-60 disabled:hover:no-underline"
      disabled={cooling || busy || disabled}
      onClick={click}
    >
      <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
      {cooling
        ? `Resend code in ${label}`
        : busy
        ? "Sending…"
        : "Didn't get a code? Resend"}
    </button>
  );
}