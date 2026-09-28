"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, Upload, Loader2, AlertCircle } from "lucide-react";

type Mode = "camera" | "upload";

/** html5-qrcode throws SYNCHRONOUSLY if stop() is called while idle. */
function safeStop(inst: Html5Qrcode) {
  try {
    const p = inst.stop();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch {
    /* scanner was never running — nothing to stop */
  }
}

export default function QrScanner({ onResult }: { onResult: (text: string) => void }) {
  const [mode, setMode] = useState<Mode>("camera");
  const [cameraOn, setCameraOn] = useState(false);
  const [scanningFile, setScanningFile] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  // Always call the latest callback without restarting the camera
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  });

  // Camera lifecycle: start in camera mode, guaranteed-safe stop on switch/unmount
  useEffect(() => {
    if (mode !== "camera") return;
    let cancelled = false;
    let started = false;
    const inst = new Html5Qrcode("qr-video", false);

    (async () => {
      setError("");
      try {
        await inst.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (text) => onResultRef.current(text),
          () => {}
        );
        if (cancelled) {
          safeStop(inst); // unmounted while starting — kill the stream
          return;
        }
        started = true;
        setCameraOn(true);
      } catch {
        if (!cancelled) {
          setCameraOn(false);
          setError("Camera unavailable. Check browser permission — or switch to Upload image.");
        }
      }
    })();

    return () => {
      cancelled = true;
      setCameraOn(false);
      if (started) safeStop(inst); // only stop what actually started
    };
  }, [mode]);

  async function handleFile(file: File) {
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG or JPG).");
      return;
    }
    setScanningFile(true);
    try {
      const inst = new Html5Qrcode("qr-file", false);
      const text = await inst.scanFile(file, false);
      try {
        inst.clear();
      } catch {
        /* ignore */
      }
      onResultRef.current(text);
    } catch {
      setError("No QR code found in that image. Try a clearer, closer photo.");
    } finally {
      setScanningFile(false);
    }
  }

  const tabCls = (active: boolean) =>
    `flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
      active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
    }`;

  return (
    <div className="space-y-4">
      {/* Mode switcher */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        <button type="button" className={tabCls(mode === "camera")} onClick={() => setMode("camera")}>
          <Camera className="h-3.5 w-3.5" />
          Use camera
        </button>
        <button type="button" className={tabCls(mode === "upload")} onClick={() => setMode("upload")}>
          <Upload className="h-3.5 w-3.5" />
          Upload image
        </button>
      </div>

      {/* Camera viewfinder */}
      {mode === "camera" && (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
          <div id="qr-video" className="aspect-[4/3] w-full" />
          {!cameraOn && !error && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-white/80">
              <Loader2 className="h-4 w-4 animate-spin" />
              Starting camera…
            </div>
          )}
          {cameraOn && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3 text-center text-xs text-white/90">
              Point your camera at the QR code on the certificate
            </div>
          )}
        </div>
      )}

      {/* Image upload dropzone */}
      {mode === "upload" && (
        <div
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            dragging
              ? "border-blue-500 bg-blue-50"
              : "border-slate-300 hover:border-blue-400 hover:bg-blue-50/40"
          }`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
        >
          {scanningFile ? (
            <>
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              <p className="text-sm font-medium text-slate-700">Scanning image…</p>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                <Upload className={`h-6 w-6 ${dragging ? "text-blue-600" : "text-blue-500"}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {dragging ? "Drop the image to scan" : "Drop a certificate image here"}
                </p>
                <p className="mt-1 text-xs text-slate-500">or click to browse — PNG or JPG</p>
              </div>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {/* Hidden mount point html5-qrcode needs for file scanning */}
      <div id="qr-file" className="hidden" />

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 animate-shake">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}