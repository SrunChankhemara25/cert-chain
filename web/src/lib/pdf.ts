import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import QRCode from "qrcode";

export type PdfInput = {
  certId: string;
  recipientName: string;
  courseTitle: string;
  orgName: string;
  issueDate: Date;
  expiryDate: Date | null;
  txHash: string;
};

const fmt = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Phnom_Penh" });
/** Draws centered text and shrinks the font until it fits. */
function centered(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  y: number,
  font: PDFFont,
  size: number,
  maxWidth = 640,
  color = rgb(0.12, 0.12, 0.12)
) {
  let s = size;
  while (font.widthOfTextAtSize(text, s) > maxWidth && s > 10) s -= 1;
  const w = font.widthOfTextAtSize(text, s);
  page.drawText(text, { x: (page.getWidth() - w) / 2, y, size: s, font, color });
}

export async function generateCertificatePdf(c: PdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();

  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);

  const navy = rgb(0.08, 0.2, 0.42);
  const gold = rgb(0.78, 0.62, 0.2);

  // borders
  page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, borderColor: navy, borderWidth: 4 });
  page.drawRectangle({ x: 32, y: 32, width: width - 64, height: height - 64, borderColor: gold, borderWidth: 1.5 });

  // text
  centered(page, c.orgName.toUpperCase(), height - 85, sans, 14, 640, navy);
  centered(page, "CERTIFICATE OF ACHIEVEMENT", height - 135, serifBold, 36, 640, navy);
  centered(page, "This is to certify that", height - 185, serif, 16);
  centered(page, c.recipientName, height - 240, serifBold, 40, 640, gold);
  centered(page, "has successfully completed", height - 280, serif, 16);
  centered(page, c.courseTitle, height - 322, serifBold, 26, 640, navy);

  const dates = c.expiryDate
    ? `Issued: ${fmt(c.issueDate)}     |     Valid until: ${fmt(c.expiryDate)}`
    : `Issued: ${fmt(c.issueDate)}     |     No expiry`;
  centered(page, dates, height - 375, sans, 12, 640);

  // QR code -> public verification page
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify/${c.certId}`;
  const qrPng = await QRCode.toBuffer(verifyUrl, { margin: 1, width: 220 });
  const qr = await pdf.embedPng(qrPng);
  page.drawImage(qr, { x: 70, y: 60, width: 100, height: 100 });

  page.drawText("Scan to verify", { x: 82, y: 48, size: 9, font: sans, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`Certificate ID: ${c.certId}`, { x: 190, y: 130, size: 10, font: sans, color: rgb(0.2, 0.2, 0.2) });
  page.drawText("Verified on blockchain. Transaction:", { x: 190, y: 112, size: 9, font: sans, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(c.txHash, { x: 190, y: 98, size: 7.5, font: sans, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(verifyUrl, { x: 190, y: 80, size: 8, font: sans, color: navy });

  return pdf.save();
}
