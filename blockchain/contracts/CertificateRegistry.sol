// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CertificateRegistry
 * @notice Stores a tamper-proof fingerprint (hash) of each issued certificate,
 *         its expiry time and its revocation state. No personal data is stored.
 */
contract CertificateRegistry {
    // ---------------------------------------------------------------- types
    enum Status { NotFound, Valid, Expired, Revoked }

    struct Certificate {
        bytes32 dataHash;      // SHA-256 of the certificate data (computed off-chain)
        address issuer;        // wallet that issued it
        uint64  issuedAt;      // block timestamp at issuance
        uint64  expiresAt;     // 0 = never expires
        uint64  revokedAt;     // 0 = not revoked
        string  revokeReason;
        bool    exists;
    }

    // -------------------------------------------------------------- storage
    address public owner;
    mapping(address => bool) public authorizedIssuers;
    mapping(string => Certificate) private certificates;
    uint256 public totalIssued;

    // --------------------------------------------------------------- events
    event CertificateIssued(
        string certId,
        bytes32 dataHash,
        address indexed issuer,
        uint64 issuedAt,
        uint64 expiresAt
    );
    event CertificateRevoked(string certId, string reason, uint64 revokedAt);
    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);

    // ------------------------------------------------------------ modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyIssuer() {
        require(authorizedIssuers[msg.sender], "Not authorized issuer");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
        emit IssuerAdded(msg.sender);
    }

    // ------------------------------------------------------- admin functions
    function addIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = true;
        emit IssuerAdded(issuer);
    }

    function removeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = false;
        emit IssuerRemoved(issuer);
    }

    // ----------------------------------------------------- issuer functions
    function issueCertificate(
        string calldata certId,
        bytes32 dataHash,
        uint64 expiresAt
    ) external onlyIssuer {
        require(bytes(certId).length > 0, "Empty certId");
        require(!certificates[certId].exists, "Certificate already exists");
        require(
            expiresAt == 0 || expiresAt > block.timestamp,
            "Expiry must be in the future"
        );

        certificates[certId] = Certificate({
            dataHash: dataHash,
            issuer: msg.sender,
            issuedAt: uint64(block.timestamp),
            expiresAt: expiresAt,
            revokedAt: 0,
            revokeReason: "",
            exists: true
        });
        totalIssued += 1;

        emit CertificateIssued(certId, dataHash, msg.sender, uint64(block.timestamp), expiresAt);
    }

    function revokeCertificate(string calldata certId, string calldata reason)
        external
        onlyIssuer
    {
        Certificate storage c = certificates[certId];
        require(c.exists, "Certificate not found");
        require(c.revokedAt == 0, "Already revoked");
        require(
            msg.sender == c.issuer || msg.sender == owner,
            "Only original issuer or owner"
        );

        c.revokedAt = uint64(block.timestamp);
        c.revokeReason = reason;

        emit CertificateRevoked(certId, reason, uint64(block.timestamp));
    }

    // --------------------------------------------------------- public reads
    /**
     * @notice Public verification. Anyone can call this for free.
     * Status priority: Revoked > Expired > Valid.
     */
    function verifyCertificate(string calldata certId)
        external
        view
        returns (
            Status status,
            bytes32 dataHash,
            address issuer,
            uint64 issuedAt,
            uint64 expiresAt,
            uint64 revokedAt,
            string memory revokeReason
        )
    {
        Certificate storage c = certificates[certId];
        if (!c.exists) {
            return (Status.NotFound, bytes32(0), address(0), 0, 0, 0, "");
        }

        if (c.revokedAt != 0) {
            status = Status.Revoked;
        } else if (c.expiresAt != 0 && block.timestamp > c.expiresAt) {
            status = Status.Expired;
        } else {
            status = Status.Valid;
        }

        return (
            status,
            c.dataHash,
            c.issuer,
            c.issuedAt,
            c.expiresAt,
            c.revokedAt,
            c.revokeReason
        );
    }
}
