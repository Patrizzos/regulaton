// lib/training-labels.ts
// Shared human-readable labels for TrainingRecord.trainingType, used both in
// the training page UI and in the compliance document generator — keeping
// these in one place means the generated documents never show a raw enum
// value like "EU_AI_ACT_LITERACY_BASICS" instead of readable text.

export const TRAINING_TYPE_LABELS: Record<string, string> = {
  EU_AI_ACT_LITERACY_BASICS:    "EU AI Act Literacy: Basics",
  EU_AI_ACT_LITERACY_ADVANCED:  "EU AI Act Literacy: Advanced",
  ACCEPTABLE_USE_POLICY_REVIEW: "AUP Review",
  HIGH_RISK_TOOL_SPECIFIC:      "High-risk tool training",
  EXTERNAL_COURSE:              "External course",
  OTHER:                        "Other",
};

export function trainingTypeLabel(type: string): string {
  return TRAINING_TYPE_LABELS[type] ?? type;
}
