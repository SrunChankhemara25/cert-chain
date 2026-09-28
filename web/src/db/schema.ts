import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true });

export const certStatusEnum = pgEnum("cert_status", ["active", "revoked"]);

// ------------------------------------------------------------------ organizations
export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),

  // Email verification (required before login)
  emailVerified: boolean("email_verified").default(false).notNull(),
  verificationCodeHash: text("verification_code_hash"),
  verificationCodeExpiresAt: ts("verification_code_expires_at"),

  // Forgot-password flow
  resetCodeHash: text("reset_code_hash"),
  resetCodeExpiresAt: ts("reset_code_expires_at"),

  // "password" or "google" - Google-created accounts get an unusable random
  // password hash (see the Google OAuth callback route) and skip email
  // verification, since Google has already verified the address.
  authProvider: text("auth_provider").default("password").notNull(),

  createdAt: ts("created_at").defaultNow().notNull(),
});

// ------------------------------------------------------------------ certificates
export const certificates = pgTable("certificates", {
  id: uuid("id").defaultRandom().primaryKey(),
  certId: text("cert_id").notNull().unique(), // public ID, e.g. CERT-2026-9F3A1C7B
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  recipientName: text("recipient_name").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  courseTitle: text("course_title").notNull(),
  description: text("description"),

  issueDate: ts("issue_date").notNull(),
  expiryDate: ts("expiry_date"), // null = never expires

  // blockchain data
  dataHash: text("data_hash").notNull(), // SHA-256 fingerprint stored on-chain
  txHash: text("tx_hash").notNull(),
  blockNumber: integer("block_number"),

  // lifecycle (EXPIRED is computed from expiryDate, never stored)
  status: certStatusEnum("status").default("active").notNull(),
  revokedAt: ts("revoked_at"),
  revokeReason: text("revoke_reason"),
  revokeTxHash: text("revoke_tx_hash"),
  expiryReminderSentAt: ts("expiry_reminder_sent_at"),

  createdAt: ts("created_at").defaultNow().notNull(),
});

// ------------------------------------------------------------------ email_logs
export const emailLogs = pgTable("email_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  certificateId: uuid("certificate_id")
    .notNull()
    .references(() => certificates.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // issued | revoked | expiring
  toEmail: text("to_email").notNull(),
  status: text("status").notNull(), // sent | failed
  error: text("error"),
  sentAt: ts("sent_at").defaultNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;