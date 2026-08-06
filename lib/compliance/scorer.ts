// lib/compliance/scorer.ts
import {
  Organization,
  OrganizationAITool,
  ComplianceDocument,
  TrainingRecord,
  RiskLevel,
  DocumentType,
  DocumentStatus,
  Status,
} from "@prisma/client";

export interface ObligationResult {
  status: Status;
  score: number;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
}

export interface ComplianceResult {
  overallScore: number;
  article4Literacy:    ObligationResult;
  acceptableUsePolicy: ObligationResult;
  aiSystemRegister:    ObligationResult;
  humanOversight:      ObligationResult;
  vendorDueDiligence:  ObligationResult;
}

function monthsAgo(date: Date): number {
  const now = new Date();
  return (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);
}

function getDoc(documents: ComplianceDocument[], type: DocumentType) {
  return documents.find((d) => d.type === type);
}

// Has a meaningful oversight procedure been entered?
// Any non-empty, non-whitespace text counts — no arbitrary length threshold.
function hasOversight(tool: OrganizationAITool): boolean {
  return !!tool.oversightProcedure && tool.oversightProcedure.trim().length > 0;
}

// ─── Obligation 1: AI Literacy (Article 4) ───────────────────────────────────

function scoreArticle4Literacy(
  documents: ComplianceDocument[],
  trainingRecords: TrainingRecord[]
): ObligationResult {
  const aup = getDoc(documents, DocumentType.ACCEPTABLE_USE_POLICY);
  const hasTrainingRecords = trainingRecords.length > 0;

  if (!aup) {
    return {
      status: Status.NON_COMPLIANT,
      score: 0,
      message: "No Acceptable Use Policy generated. Article 4 requires documented AI governance.",
      actionLabel: "Generate AUP",
      actionUrl: "/documents/acceptable-use-policy",
    };
  }

  if (aup.status === DocumentStatus.DRAFT) {
    return {
      status: Status.PARTIAL,
      score: 30,
      message: "Your Acceptable Use Policy is a draft. Finalise it to satisfy Article 4.",
      actionLabel: "Finalise AUP",
      actionUrl: "/documents/acceptable-use-policy",
    };
  }

  if (aup.status === DocumentStatus.FINALIZED && !hasTrainingRecords) {
    return {
      status: Status.PARTIAL,
      score: 60,
      message: "AUP is finalised. Add staff training records to complete Article 4 compliance.",
      actionLabel: "Add training records",
      actionUrl: "/training",
    };
  }

  if (aup.finalizedAt && monthsAgo(aup.finalizedAt) > 12) {
    return {
      status: Status.PARTIAL,
      score: 70,
      message: "Your AUP is over 12 months old. Review and re-finalise annually.",
      actionLabel: "Review AUP",
      actionUrl: "/documents/acceptable-use-policy",
    };
  }

  if (aup.status === DocumentStatus.FINALIZED && hasTrainingRecords) {
    return {
      status: Status.COMPLIANT,
      score: 100,
      message: `Compliant. AUP finalised, ${trainingRecords.length} training record${trainingRecords.length === 1 ? "" : "s"} on file.`,
    };
  }

  return {
    status: Status.PARTIAL,
    score: 50,
    message: "Partial compliance. Review your AUP and training records.",
    actionLabel: "Review",
    actionUrl: "/documents",
  };
}

// ─── Obligation 2: Acceptable Use Policy ─────────────────────────────────────

function scoreAcceptableUsePolicy(documents: ComplianceDocument[]): ObligationResult {
  const aup = getDoc(documents, DocumentType.ACCEPTABLE_USE_POLICY);

  if (!aup) {
    return {
      status: Status.NON_COMPLIANT,
      score: 0,
      message: "No Acceptable Use Policy exists. Generate one from your tool inventory.",
      actionLabel: "Generate policy",
      actionUrl: "/documents/acceptable-use-policy",
    };
  }

  if (aup.status === DocumentStatus.NEEDS_UPDATE) {
    return {
      status: Status.PARTIAL,
      score: 55,
      message: "Your tool inventory changed since this document was last generated. Regenerate to reflect current tools.",
      actionLabel: "Regenerate",
      actionUrl: "/documents/acceptable-use-policy",
    };
  }

  if (aup.status === DocumentStatus.DRAFT) {
    return {
      status: Status.PARTIAL,
      score: 40,
      message: "AUP is a draft. Review, sign, and mark as finalised.",
      actionLabel: "Finalise",
      actionUrl: "/documents/acceptable-use-policy",
    };
  }

  if (aup.status === DocumentStatus.FINALIZED) {
    const ageMonths = aup.finalizedAt ? monthsAgo(aup.finalizedAt) : 0;
    if (ageMonths > 12) {
      return {
        status: Status.PARTIAL,
        score: 75,
        message: "AUP finalised but overdue for annual review.",
        actionLabel: "Review now",
        actionUrl: "/documents/acceptable-use-policy",
      };
    }
    return {
      status: Status.COMPLIANT,
      score: 100,
      message: "AUP is finalised and current.",
    };
  }

  return { status: Status.NON_COMPLIANT, score: 0, message: "Unknown state." };
}

// ─── Obligation 3: AI System Register ────────────────────────────────────────

function scoreAISystemRegister(
  tools: OrganizationAITool[],
  documents: ComplianceDocument[]
): ObligationResult {
  if (tools.length === 0) {
    return {
      status: Status.NON_COMPLIANT,
      score: 0,
      message: "No AI tools in your inventory. Add the AI tools your organisation uses.",
      actionLabel: "Add tools",
      actionUrl: "/inventory",
    };
  }

  const register = getDoc(documents, DocumentType.AI_SYSTEM_REGISTER);

  if (!register) {
    return {
      status: Status.PARTIAL,
      score: 25,
      message: `${tools.length} tool${tools.length === 1 ? "" : "s"} in inventory but no register generated yet.`,
      actionLabel: "Generate register",
      actionUrl: "/documents/ai-system-register",
    };
  }

  const requiredFields: (keyof OrganizationAITool)[] = [
    "department",
    "usageDescription",
    "accountablePerson",
  ];

  const incompleteTools = tools.filter((tool) =>
    requiredFields.some((field) => !tool[field])
  );

  const completenessPct = Math.round(
    ((tools.length - incompleteTools.length) / tools.length) * 100
  );

  if (register.status === DocumentStatus.NEEDS_UPDATE) {
    return {
      status: Status.PARTIAL,
      score: 50,
      message: "Tool inventory changed since register was generated. Regenerate to stay current.",
      actionLabel: "Regenerate",
      actionUrl: "/documents/ai-system-register",
    };
  }

  if (incompleteTools.length > 0) {
    return {
      status: Status.PARTIAL,
      score: Math.round(50 + completenessPct * 0.4),
      message: `Register generated but ${incompleteTools.length} tool${incompleteTools.length === 1 ? "" : "s"} ha${incompleteTools.length === 1 ? "s" : "ve"} incomplete profiles.`,
      actionLabel: "Complete profiles",
      actionUrl: "/inventory",
    };
  }

  if (register.status === DocumentStatus.FINALIZED) {
    return {
      status: Status.COMPLIANT,
      score: 100,
      message: `Register finalised. ${tools.length} tool${tools.length === 1 ? "" : "s"} fully documented.`,
    };
  }

  return {
    status: Status.PARTIAL,
    score: 75,
    message: "Register generated. Finalise it to confirm accuracy.",
    actionLabel: "Finalise",
    actionUrl: "/documents/ai-system-register",
  };
}

// ─── Obligation 4: Human Oversight (Article 14) ──────────────────────────────
//
// Required for HIGH risk AI systems only. Two things both have to be true to
// be COMPLIANT: every high-risk tool has an oversight procedure entered on
// its tool record (the legal substance), AND the generated Oversight
// Procedure document is finalised and current (the audit-ready artifact).
// Having the procedure text alone isn't enough if the document that's
// supposed to evidence it is stale or still a draft — mirrors how AUP and
// the Register are scored, so all four obligations behave consistently.

function scoreHumanOversight(
  tools: OrganizationAITool[],
  documents: ComplianceDocument[]
): ObligationResult {
  const highRiskTools = tools.filter(
    (t) => t.riskLevel === RiskLevel.HIGH && t.status === "ACTIVE"
  );

  if (highRiskTools.length === 0) {
    return {
      status: Status.NOT_APPLICABLE,
      score: 100,
      message: "No high-risk AI tools in use. No oversight procedures required.",
    };
  }

  const toolsWithProcedures    = highRiskTools.filter(hasOversight);
  const toolsWithoutProcedures = highRiskTools.filter((t) => !hasOversight(t));
  const coveragePct = Math.round((toolsWithProcedures.length / highRiskTools.length) * 100);

  // None have procedures yet
  if (toolsWithProcedures.length === 0) {
    return {
      status: Status.NON_COMPLIANT,
      score: 0,
      message: `${highRiskTools.length} high-risk tool${highRiskTools.length === 1 ? "" : "s"} in use with no oversight procedures documented. Open each tool in your inventory and fill in the oversight procedure field.`,
      actionLabel: "Go to inventory",
      actionUrl: "/inventory",
    };
  }

  // Some but not all have procedures
  if (toolsWithoutProcedures.length > 0) {
    return {
      status: Status.PARTIAL,
      score: Math.round(coveragePct * 0.85),
      message: `${toolsWithProcedures.length} of ${highRiskTools.length} high-risk tools have oversight procedures. Add procedures for: ${toolsWithoutProcedures.map((t) => t.customName ?? (t as any).libraryTool?.name ?? "Unknown").join(", ")}.`,
      actionLabel: "Complete in inventory",
      actionUrl: "/inventory",
    };
  }

  // Every high-risk tool has a procedure on file — now check the document itself
  const oversightDoc = getDoc(documents, DocumentType.OVERSIGHT_PROCEDURE);

  if (!oversightDoc) {
    return {
      status: Status.PARTIAL,
      score: 70,
      message: `All ${highRiskTools.length} high-risk tool${highRiskTools.length === 1 ? "" : "s"} have oversight procedures on file, but the Oversight Procedure document hasn't been generated yet.`,
      actionLabel: "Generate document",
      actionUrl: "/documents/oversight-procedure",
    };
  }

  if (oversightDoc.status === DocumentStatus.NEEDS_UPDATE) {
    return {
      status: Status.PARTIAL,
      score: 55,
      message: "Your tool inventory or organisation details changed since this document was generated. Regenerate to reflect current information.",
      actionLabel: "Regenerate",
      actionUrl: "/documents/oversight-procedure",
    };
  }

  if (oversightDoc.status === DocumentStatus.DRAFT) {
    return {
      status: Status.PARTIAL,
      score: 80,
      message: `All ${highRiskTools.length} high-risk tool${highRiskTools.length === 1 ? "" : "s"} have oversight procedures documented. Finalise the Oversight Procedure document to complete Article 14 compliance.`,
      actionLabel: "Finalise document",
      actionUrl: "/documents/oversight-procedure",
    };
  }

  return {
    status: Status.COMPLIANT,
    score: 100,
    message: `All ${highRiskTools.length} high-risk tool${highRiskTools.length === 1 ? "" : "s"} have documented oversight procedures, and the Oversight Procedure document is finalised and current.`,
  };
}

// ─── Obligation 5: Vendor Due Diligence ──────────────────────────────────────

function scoreVendorDueDiligence(tools: OrganizationAITool[]): ObligationResult {
  if (tools.length === 0) {
    return { status: Status.NOT_APPLICABLE, score: 100, message: "No tools in inventory." };
  }

  const activeTools = tools.filter((t) => t.status === "ACTIVE");
  if (activeTools.length === 0) {
    return { status: Status.NOT_APPLICABLE, score: 100, message: "No active tools." };
  }

  const checkedTools     = activeTools.filter((t) => t.vendorCompliance !== null);
  const compliantVendors = activeTools.filter((t) => t.vendorCompliance === true);
  const checkedPct       = Math.round((checkedTools.length / activeTools.length) * 100);

  if (checkedTools.length === 0) {
    return {
      status: Status.NON_COMPLIANT,
      score: 0,
      message: `No vendor compliance checks done for ${activeTools.length} tool${activeTools.length === 1 ? "" : "s"}. Open each tool in your inventory and mark whether the vendor has published an EU AI Act statement.`,
      actionLabel: "Review vendors",
      actionUrl: "/inventory",
    };
  }

  if (checkedTools.length < activeTools.length) {
    return {
      status: Status.PARTIAL,
      score: Math.round(checkedPct * 0.8),
      message: `${checkedTools.length} of ${activeTools.length} vendors checked. ${activeTools.length - checkedTools.length} still need review.`,
      actionLabel: "Continue reviewing",
      actionUrl: "/inventory",
    };
  }

  return {
    status: Status.COMPLIANT,
    score: 100,
    message: `All ${activeTools.length} vendor${activeTools.length === 1 ? "" : "s"} reviewed. ${compliantVendors.length} have published AI Act compliance statements.`,
  };
}

// ─── Main scorer ──────────────────────────────────────────────────────────────

export function calculateComplianceScore(
  org: Organization,
  tools: OrganizationAITool[],
  documents: ComplianceDocument[],
  trainingRecords: TrainingRecord[]
): ComplianceResult {
  const article4Literacy    = scoreArticle4Literacy(documents, trainingRecords);
  const acceptableUsePolicy = scoreAcceptableUsePolicy(documents);
  const aiSystemRegister    = scoreAISystemRegister(tools, documents);
  const humanOversight      = scoreHumanOversight(tools, documents);
  const vendorDueDiligence  = scoreVendorDueDiligence(tools);

  const overallScore = Math.round(
    article4Literacy.score    * 0.20 +
    acceptableUsePolicy.score * 0.20 +
    aiSystemRegister.score    * 0.20 +
    humanOversight.score      * 0.20 +
    vendorDueDiligence.score  * 0.20
  );

  return {
    overallScore,
    article4Literacy,
    acceptableUsePolicy,
    aiSystemRegister,
    humanOversight,
    vendorDueDiligence,
  };
}

export function getScoreLabel(score: number): string {
  if (score === 100) return "Fully compliant";
  if (score >= 80)   return "Almost there";
  if (score >= 60)   return "In progress";
  if (score >= 40)   return "Getting started";
  return "Action needed";
}

export function getScoreColour(score: number): string {
  if (score >= 80) return "#059669";
  if (score >= 50) return "#D97706";
  return "#DC2626";
}
