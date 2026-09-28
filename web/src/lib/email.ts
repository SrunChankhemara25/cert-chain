import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { db } from "@/db";
import { emailLogs } from "@/db/schema";
import { OTP_EXPIRY_MINUTES } from "./otp";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  family: 4,
} as SMTPTransport.Options);
type Mail = {
  certificateId: string; // DB uuid, for the log
  type: "issued" | "revoked" | "expiring";
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer }[];
};

/** Sends an email and records the result. Never throws. */
async function send(m: Mail) {
  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
      to: m.to,
      subject: m.subject,
      html: m.html,
      attachments: m.attachments,
    });
    await db.insert(emailLogs).values({
      certificateId: m.certificateId, type: m.type, toEmail: m.to, status: "sent",
    });
  } catch (err) {
    console.error("Email failed:", err);
    await db.insert(emailLogs).values({
      certificateId: m.certificateId, type: m.type, toEmail: m.to, status: "failed",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// Escape user-supplied text before putting it in an HTML email
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]!));

const verifyLink = (certId: string) => `${process.env.NEXT_PUBLIC_APP_URL}/verify/${certId}`;

export function sendIssuedEmail(p: {
  certificateId: string; to: string; name: string; course: string; orgName: string;
  certId: string; pdf: Uint8Array;
}) {
  return send({
    certificateId: p.certificateId, type: "issued", to: p.to,
    subject: `Your certificate: ${p.course}`,
    html: `<p>Hello ${esc(p.name)},</p>
      <p>Congratulations! <b>${esc(p.orgName)}</b> has issued you a certificate for <b>${esc(p.course)}</b>.</p>
      <p>Your PDF certificate is attached. Anyone can verify it here:<br/>
      <a href="${verifyLink(p.certId)}">${verifyLink(p.certId)}</a></p>
      <p>Certificate ID: <b>${p.certId}</b></p>`,
    attachments: [{ filename: `${p.certId}.pdf`, content: Buffer.from(p.pdf) }],
  });
}

export function sendRevokedEmail(p: {
  certificateId: string; to: string; name: string; course: string; orgName: string;
  certId: string; reason: string;
}) {
  return send({
    certificateId: p.certificateId, type: "revoked", to: p.to,
    subject: `Certificate revoked: ${p.course}`,
    html: `<p>Hello ${esc(p.name)},</p>
      <p><b>${esc(p.orgName)}</b> has revoked your certificate <b>${p.certId}</b> (${esc(p.course)}).</p>
      <p>Reason: ${esc(p.reason)}</p>
      <p>The public verification page now shows this certificate as <b>REVOKED</b>.</p>`,
  });
}

export function sendExpiryReminderEmail(p: {
  certificateId: string; to: string; name: string; course: string; orgName: string;
  certId: string; expiryDate: Date;
}) {
  return send({
    certificateId: p.certificateId, type: "expiring", to: p.to,
    subject: `Your certificate expires soon: ${p.course}`,
    html: `<p>Hello ${esc(p.name)},</p>
      <p>Your certificate <b>${p.certId}</b> (${esc(p.course)}) from <b>${esc(p.orgName)}</b>
      expires on <b>${p.expiryDate.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Phnom_Penh" })}</b>.</p>
      <p>Please contact ${esc(p.orgName)} if you need it renewed.</p>`,
  });
}

// ---------------------------------------------------------------- auth emails
// These aren't tied to a certificate, so they don't go through emailLogs
// (which requires a certificateId). Returns whether sending succeeded.
async function sendAuthMail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    await transporter.sendMail({ from: process.env.MAIL_FROM ?? process.env.SMTP_USER, to, subject, html });
    return true;
  } catch (err) {
    console.error("Auth email failed:", err);
    return false;
  }
}

function codeEmailBody(name: string, code: string, purpose: string, ignoreNote: string) {
  return `<p>Hello ${esc(name)},</p>
    <p>${purpose}</p>
    <p style="font-size:28px;font-weight:bold;letter-spacing:6px;margin:20px 0;">${code}</p>
    <p>This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
    <p style="color:#666;font-size:13px;">${ignoreNote}</p>`;
}

export function sendVerificationEmail(p: { to: string; name: string; code: string }) {
  return sendAuthMail(
    p.to,
    "Verify your CertChain account",
    codeEmailBody(
      p.name,
      p.code,
      "Your verification code is:",
      "If you didn't create a CertChain account, you can safely ignore this email."
    )
  );
}

export function sendPasswordResetEmail(p: { to: string; name: string; code: string }) {
  return sendAuthMail(
    p.to,
    "Reset your CertChain password",
    codeEmailBody(
      p.name,
      p.code,
      "Your password reset code is:",
      "If you didn't request this, you can safely ignore this email — your password will not be changed."
    )
  );
}
export function sendLoginCodeEmail(p: { to: string; name: string; code: string }) {
  return sendAuthMail(
    p.to,
    "Your CertChain login code",
    codeEmailBody(
      p.name,
      p.code,
      "Your one-time login code is:",
      "If you didn't try to log in, you can safely ignore this email."
    )
  );
}