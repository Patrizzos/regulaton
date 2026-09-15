// lib/documents.ts
import { DocumentType, DocumentStatus, StaleReason } from "@prisma/client";

export const TYPE_FROM_SLUG: Record<string, DocumentType> = {
  "acceptable-use-policy":         DocumentType.ACCEPTABLE_USE_POLICY,
  "ai-system-register":            DocumentType.AI_SYSTEM_REGISTER,
  "training-records":              DocumentType.LITERACY_TRAINING_RECORD,
  "oversight-procedure":           DocumentType.OVERSIGHT_PROCEDURE,
  "fundamental-rights-assessment": DocumentType.FUNDAMENTAL_RIGHTS_ASSESSMENT,
};

export const SLUG_FROM_TYPE: Record<DocumentType, string> = {
  [DocumentType.ACCEPTABLE_USE_POLICY]:          "acceptable-use-policy",
  [DocumentType.AI_SYSTEM_REGISTER]:             "ai-system-register",
  [DocumentType.LITERACY_TRAINING_RECORD]:       "training-records",
  [DocumentType.OVERSIGHT_PROCEDURE]:            "oversight-procedure",
  [DocumentType.FUNDAMENTAL_RIGHTS_ASSESSMENT]:  "fundamental-rights-assessment",
};

export const DOC_META: Record<DocumentType, {
  title: string;
  articleRef: string;
  description: string;
  accentColor: string;
}> = {
  [DocumentType.ACCEPTABLE_USE_POLICY]: {
    title:       "Acceptable Use Policy",
    articleRef:  "Article 4 · In force since Feb 2025",
    description: "Defines approved AI tools, permitted uses, prohibited uses, and staff obligations.",
    accentColor: "#60A5FA",
  },
  [DocumentType.AI_SYSTEM_REGISTER]: {
    title:       "AI System Register",
    articleRef:  "Articles 6–7 · In force since Aug 2026",
    description: "A complete inventory of every AI system your organisation uses.",
    accentColor: "#34D399",
  },
  [DocumentType.LITERACY_TRAINING_RECORD]: {
    title:       "Staff Training Records",
    articleRef:  "Article 4 · In force since Feb 2025",
    description: "Documents staff AI literacy training completions as required by Article 4.",
    accentColor: "#FBBF24",
  },
  [DocumentType.OVERSIGHT_PROCEDURE]: {
    title:       "Human Oversight Procedure",
    articleRef:  "Article 14 · High-risk only · Deadline Dec 2027",
    description: "Required oversight procedures for any high-risk AI systems in use. Annex III deadline extended to December 2, 2027.",
    accentColor: "#A78BFA",
  },
  [DocumentType.FUNDAMENTAL_RIGHTS_ASSESSMENT]: {
    title:       "Fundamental Rights Impact Assessment",
    articleRef:  "Article 27 · Certain deployers only · Deadline Dec 2027",
    description: "Assesses the impact of high-risk AI systems on individuals' fundamental rights. Mandatory for public bodies and deployers assessing creditworthiness or insurance risk — good practice for others.",
    accentColor: "#FB923C",
  },
};

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  [DocumentStatus.DRAFT]:        "Draft",
  [DocumentStatus.FINALIZED]:    "Finalised",
  [DocumentStatus.NEEDS_UPDATE]: "Needs update",
};

export const STATUS_COLORS: Record<DocumentStatus, { bg: string; text: string; border: string }> = {
  [DocumentStatus.DRAFT]: {
    bg: "var(--warning-bg)", text: "var(--warning)", border: "var(--warning-border)",
  },
  [DocumentStatus.FINALIZED]: {
    bg: "var(--success-bg)", text: "var(--success)", border: "var(--success-border)",
  },
  [DocumentStatus.NEEDS_UPDATE]: {
    bg: "var(--danger-bg)", text: "var(--danger)", border: "var(--danger-border)",
  },
};

// Why a NEEDS_UPDATE document went stale, so the UI can tell the person what
// actually changed instead of a one-size-fits-all "tool inventory" message.
// staleReason is null on rows from before this field existed, or in any other
// case we haven't specifically attributed — STALE_REASON_MESSAGES falls back
// to a generic message for that case.
export const STALE_REASON_MESSAGES: Record<StaleReason, string> = {
  [StaleReason.TOOLS_CHANGED]: "Your AI tool inventory changed since this document was generated. Regenerate to reflect your current tools.",
  [StaleReason.ORG_CHANGED]:   "Your organisation details changed since this document was generated. Regenerate to reflect your current details.",
};

const GENERIC_STALE_MESSAGE = "This document is out of date. Regenerate to reflect your current information.";

export function staleReasonMessage(reason: StaleReason | null | undefined): string {
  return reason ? STALE_REASON_MESSAGES[reason] : GENERIC_STALE_MESSAGE;
}

export const STALE_REASON_TITLES: Record<StaleReason, string> = {
  [StaleReason.TOOLS_CHANGED]: "Your tool inventory changed",
  [StaleReason.ORG_CHANGED]:   "Your organisation details changed",
};

const GENERIC_STALE_TITLE = "This document is out of date";

export function staleReasonTitle(reason: StaleReason | null | undefined): string {
  return reason ? STALE_REASON_TITLES[reason] : GENERIC_STALE_TITLE;
}
