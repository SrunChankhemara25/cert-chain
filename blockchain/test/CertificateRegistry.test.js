const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const Status = { NotFound: 0, Valid: 1, Expired: 2, Revoked: 3 };
const HASH = ethers.sha256(ethers.toUtf8Bytes("demo certificate data"));

describe("CertificateRegistry", () => {
  let registry, owner, other;

  beforeEach(async () => {
    [owner, other] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("CertificateRegistry");
    registry = await Registry.deploy();
  });

  it("issues a certificate and verifies it as Valid", async () => {
    await registry.issueCertificate("CERT-1", HASH, 0);
    const r = await registry.verifyCertificate("CERT-1");
    expect(r.status).to.equal(Status.Valid);
    expect(r.dataHash).to.equal(HASH);
    expect(r.issuer).to.equal(owner.address);
  });

  it("returns NotFound for unknown IDs", async () => {
    const r = await registry.verifyCertificate("NOPE");
    expect(r.status).to.equal(Status.NotFound);
  });

  it("rejects duplicate IDs", async () => {
    await registry.issueCertificate("CERT-1", HASH, 0);
    await expect(registry.issueCertificate("CERT-1", HASH, 0)).to.be.revertedWith(
      "Certificate already exists"
    );
  });

  it("only authorized issuers can issue", async () => {
    await expect(
      registry.connect(other).issueCertificate("CERT-2", HASH, 0)
    ).to.be.revertedWith("Not authorized issuer");
    await registry.addIssuer(other.address);
    await registry.connect(other).issueCertificate("CERT-2", HASH, 0);
  });

  it("becomes Expired after expiresAt", async () => {
    const expiresAt = (await time.latest()) + 3600;
    await registry.issueCertificate("CERT-3", HASH, expiresAt);
    expect((await registry.verifyCertificate("CERT-3")).status).to.equal(Status.Valid);
    await time.increase(7200);
    expect((await registry.verifyCertificate("CERT-3")).status).to.equal(Status.Expired);
  });

  it("can be revoked, and Revoked beats Expired", async () => {
    await registry.issueCertificate("CERT-4", HASH, 0);
    await registry.revokeCertificate("CERT-4", "Issued by mistake");
    const r = await registry.verifyCertificate("CERT-4");
    expect(r.status).to.equal(Status.Revoked);
    expect(r.revokeReason).to.equal("Issued by mistake");
    await expect(registry.revokeCertificate("CERT-4", "again")).to.be.revertedWith(
      "Already revoked"
    );
  });
});
