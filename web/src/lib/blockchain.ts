import { ethers } from "ethers";

// Human-readable ABI - must match contracts/CertificateRegistry.sol
export const REGISTRY_ABI = [
  "function issueCertificate(string certId, bytes32 dataHash, uint64 expiresAt)",
  "function revokeCertificate(string certId, string reason)",
  "function verifyCertificate(string certId) view returns (uint8 status, bytes32 dataHash, address issuer, uint64 issuedAt, uint64 expiresAt, uint64 revokedAt, string revokeReason)",
  "function totalIssued() view returns (uint256)",
  "event CertificateIssued(string certId, bytes32 dataHash, address indexed issuer, uint64 issuedAt, uint64 expiresAt)",
  "event CertificateRevoked(string certId, string reason, uint64 revokedAt)",
];

const provider = () => new ethers.JsonRpcProvider(process.env.RPC_URL);

function readContract() {
  return new ethers.Contract(process.env.CONTRACT_ADDRESS!, REGISTRY_ABI, provider());
}

function writeContract() {
  const wallet = new ethers.Wallet(process.env.ISSUER_PRIVATE_KEY!, provider());
  return new ethers.Contract(process.env.CONTRACT_ADDRESS!, REGISTRY_ABI, wallet);
}

export type TxResult = { txHash: string; blockNumber: number };

/** Writes a new certificate fingerprint to the blockchain. Waits for 1 confirmation. */
export async function issueOnChain(
  certId: string,
  dataHash: string,
  expiresAtUnix: number
): Promise<TxResult> {
  const tx = await writeContract().issueCertificate(certId, dataHash, expiresAtUnix);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

/** Marks a certificate as revoked on the blockchain. */
export async function revokeOnChain(certId: string, reason: string): Promise<TxResult> {
  const tx = await writeContract().revokeCertificate(certId, reason);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

export type ChainStatus = "NOT_FOUND" | "VALID" | "EXPIRED" | "REVOKED";
const STATUS_MAP: ChainStatus[] = ["NOT_FOUND", "VALID", "EXPIRED", "REVOKED"];

export type ChainRecord = {
  status: ChainStatus;
  dataHash: string;
  issuer: string;
  issuedAt: number;
  expiresAt: number;
  revokedAt: number;
  revokeReason: string;
};

/** Free, read-only call - anyone can do this. */
export async function verifyOnChain(certId: string): Promise<ChainRecord> {
  const r = await readContract().verifyCertificate(certId);
  return {
    status: STATUS_MAP[Number(r.status)],
    dataHash: String(r.dataHash),
    issuer: String(r.issuer),
    issuedAt: Number(r.issuedAt),
    expiresAt: Number(r.expiresAt),
    revokedAt: Number(r.revokedAt),
    revokeReason: String(r.revokeReason),
  };
}

// Returns null when there's no real public explorer to link to (e.g. a
// local Hardhat network) - the UI shows plain text instead of a broken link.
function hasExplorer(): boolean {
  const url = process.env.NEXT_PUBLIC_EXPLORER_URL;
  return Boolean(url) && url !== "local";
}
export const explorerTxUrl = (tx: string): string | null =>
  hasExplorer() ? `${process.env.NEXT_PUBLIC_EXPLORER_URL}/tx/${tx}` : null;
export const explorerAddressUrl = (addr: string): string | null =>
  hasExplorer() ? `${process.env.NEXT_PUBLIC_EXPLORER_URL}/address/${addr}` : null;