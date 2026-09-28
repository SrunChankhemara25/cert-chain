import Link from "next/link";
import {
  ShieldCheck,
  ScanLine,
  FileText,
  Mail,
  Clock,
  Ban,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Tamper-proof",
    description:
      "Every certificate is fingerprinted with SHA-256 and anchored on-chain. Nobody can silently edit or forge it.",
  },
  {
    icon: ScanLine,
    title: "Instant verification",
    description:
      "Anyone can verify a certificate in seconds using its ID or by scanning the QR code — no account needed.",
  },
  {
    icon: FileText,
    title: "Professional PDFs",
    description:
      "Beautiful A4 certificate PDFs with embedded QR codes, generated and emailed automatically.",
  },
  {
    icon: Mail,
    title: "Email notifications",
    description:
      "Recipients are notified when a certificate is issued, revoked, or about to expire.",
  },
  {
    icon: Clock,
    title: "Expiry management",
    description:
      "Optional expiry dates with automatic 30-day reminder emails via a daily cron job.",
  },
  {
    icon: Ban,
    title: "Revocation",
    description:
      "Organizations can revoke certificates with a reason, recorded permanently on the blockchain.",
  },
];

export default function Home() {
  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="text-center pt-12 space-y-6">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-medium px-3 py-1.5 rounded-full border border-brand-200">
          <ShieldCheck className="h-3.5 w-3.5" />
          Blockchain-verified certificates
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight max-w-2xl mx-auto">
          Certificates you can{" "}
          <span className="text-brand-600">actually trust</span>
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto text-lg leading-relaxed">
          Every certificate is fingerprinted and recorded on the blockchain, so
          it cannot be forged or silently changed — and anyone can verify it in
          seconds.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <Link href="/verify" className="btn btn-lg">
            Verify a Certificate
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/login" className="btn-outline btn-lg">
            Organization Login
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-900">How it works</h2>
          <p className="text-slate-500 mt-1">Three simple steps from issuance to verification</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Organization issues",
              desc: "A registered organization fills in the recipient details. The system computes a SHA-256 fingerprint of the certificate data.",
            },
            {
              step: "02",
              title: "Fingerprint goes on-chain",
              desc: "The fingerprint is written to a smart contract on Ethereum Sepolia. Only the hash goes on-chain — never personal data.",
            },
            {
              step: "03",
              title: "Anyone verifies",
              desc: "Anyone with the Certificate ID or QR code can verify authenticity, check status, and see the blockchain proof.",
            },
          ].map((item) => (
            <div key={item.step} className="card p-6 space-y-3">
              <span className="text-xs font-mono text-brand-600 bg-brand-50 px-2 py-1 rounded-md">
                {item.step}
              </span>
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-900">Everything you need</h2>
          <p className="text-slate-500 mt-1">
            Beyond the minimum requirements, built for real-world use
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="card p-5 space-y-3 hover:shadow-card-hover transition-shadow"
            >
              <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center">
                <f.icon className="h-5 w-5 text-brand-600" />
              </div>
              <h3 className="font-medium text-slate-900 text-sm">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}