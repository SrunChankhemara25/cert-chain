import { eq } from "drizzle-orm";
import { db } from "@/db";
import { certificates, organizations } from "@/db/schema";
import { verifyOnChain, type ChainRecord, type ChainStatus } from "./blockchain";
import { computeCertHash } from "./hash";

export type VerificationResult = {
  found: boolean;
  status: ChainStatus; // the blockchain is the source of truth
  integrityOk: boolean | null; // does the database record still match the on-chain hash?
  chainError: string | null;
  chain: ChainRecord | null;
  certificate: {
    certId: string;
    recipientName: string;
    courseTitle: string;
    description: string | null;
    orgName: string;
    issueDate: Date;
    expiryDate: Date | null;
    txHash: string;
    blockNumber: number | null;
    revokeTxHash: string | null;
  } | null;
};

export async function getVerification(certId: string): Promise<VerificationResult> {
  const [row] = await db
    .select({ c: certificates, orgName: organizations.name })
    .from(certificates)
    .innerJoin(organizations, eq(certificates.orgId, organizations.id))
    .where(eq(certificates.certId, certId))
    .limit(1);

  let chain: ChainRecord | null = null;
  let chainError: string | null = null;
  try {
    chain = await verifyOnChain(certId);
  } catch (e) {
    chainError = e instanceof Error ? e.message : "Blockchain unreachable";
  }

  const onChain = chain && chain.status !== "NOT_FOUND" ? chain : null;

  let integrityOk: boolean | null = null;
  if (row && onChain) {
    const recomputed = computeCertHash({
      certId: row.c.certId,
      recipientName: row.c.recipientName,
      recipientEmail: row.c.recipientEmail,
      courseTitle: row.c.courseTitle,
      issueDate: row.c.issueDate,
      expiryDate: row.c.expiryDate,
    });
    integrityOk = recomputed.toLowerCase() === onChain.dataHash.toLowerCase();
  }

  return {
    found: Boolean(row || onChain),
    status: onChain ? onChain.status : "NOT_FOUND",
    integrityOk,
    chainError,
    chain: onChain,
    certificate: row
      ? {
          certId: row.c.certId,
          recipientName: row.c.recipientName, // email is intentionally NOT exposed
          courseTitle: row.c.courseTitle,
          description: row.c.description,
          orgName: row.orgName,
          issueDate: row.c.issueDate,
          expiryDate: row.c.expiryDate,
          txHash: row.c.txHash,
          blockNumber: row.c.blockNumber,
          revokeTxHash: row.c.revokeTxHash,
        }
      : null,
  };
}
