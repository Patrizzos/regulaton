"use client";
// app/(marketing)/check/page.tsx
// Free EU AI Act applicability checker — no login required.
// 5 questions, instant verdict with article-level citations.

import { useState } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Answers {
  location:    string;   // EU_INSIDE | EU_CUSTOMERS | OUTSIDE_EU
  orgRole:     string;   // DEPLOYER | PROVIDER | BOTH
  tools:       string[]; // multi-select
  highRisk:    string[]; // multi-select
  size:        string;   // MICRO | SMALL | MEDIUM | LARGE
}

interface Obligation {
  article:  string;
  title:    string;
  status:   "IN_FORCE" | "UPCOMING" | "EXTENDED";
  deadline: string;
  what:     string;
}

interface Result {
  applies:      "YES" | "MAYBE" | "NO";
  headline:     string;
  summary:      string;
  obligations:  Obligation[];
  score:        number; // 0-100 urgency
  size:         string; // carried through so the CTA can reflect plan fit
}

// ─── Scoring logic ────────────────────────────────────────────────────────────

function calculateResult(a: Answers): Result {
  // Doesn't apply at all
  if (a.location === "OUTSIDE_EU") {
    return {
      applies:  "NO",
      headline: "The EU AI Act likely does not apply to your organisation",
      summary:
        "Based on your answers, your organisation operates entirely outside the EU and does not serve EU-based customers or employees. The EU AI Act applies based on where the AI's impact is felt, not where the company is headquartered, but without EU market presence, you're outside scope for now.",
      obligations: [],
      score: 0,
      size: a.size,
    };
  }

  const isHighRisk = a.highRisk.some((h) =>
    ["HIRING", "CREDIT", "CRITICAL_INFRA", "LAW_ENFORCEMENT"].includes(h)
  );
  const isProvider  = a.orgRole === "PROVIDER" || a.orgRole === "BOTH";
  const hasCustomerFacing = a.tools.includes("CHATBOT");
  const hasSyntheticMedia = a.tools.includes("IMAGE_VIDEO");
  const usesAI = a.tools.length > 0;

  const obligations: Obligation[] = [];

  // Article 4 — always applies if they use AI and have EU presence
  if (usesAI) {
    obligations.push({
      article:  "Article 4",
      title:    "AI Literacy",
      status:   "IN_FORCE",
      deadline: "In force since 2 February 2025",
      what:
        "All staff who use or oversee AI systems must have documented AI literacy training appropriate to their role. You need an Acceptable Use Policy and training records on file.",
    });
  }

  // Article 5 — prohibited practices
  obligations.push({
    article:  "Article 5",
    title:    "Prohibited AI Practices",
    status:   "IN_FORCE",
    deadline: "In force since 2 February 2025",
    what:
      "Certain AI uses are banned outright in the EU: social scoring, real-time biometric surveillance in public spaces, subliminal manipulation, and AI that exploits vulnerabilities. You must ensure none of your AI tools perform these functions.",
  });

  // Article 50 — transparency for customer-facing AI
  if (hasCustomerFacing) {
    obligations.push({
      article:  "Article 50",
      title:    "Transparency Obligations",
      status:   "IN_FORCE",
      deadline: "In force since 2 August 2026",
      what:
        "When an AI system interacts with people, those people must be informed they are interacting with AI. Customer-facing chatbots must clearly disclose their AI nature at the start of every interaction.",
    });
  }

  // Article 50 — synthetic media labelling
  if (hasSyntheticMedia) {
    obligations.push({
      article:  "Article 50(2)",
      title:    "Synthetic Media Labelling",
      status:   "UPCOMING",
      deadline: "2 December 2026 (existing systems delayed)",
      what:
        "AI-generated images, audio, and video must be labelled as AI-generated or synthetic where there is a risk of public confusion. This applies to marketing content, AI avatars, and AI-generated social media assets.",
    });
  }

  // Annex III — high risk obligations
  if (isHighRisk) {
    obligations.push({
      article:  "Annex III + Articles 9–15",
      title:    "High-Risk AI System Obligations",
      status:   "EXTENDED",
      deadline: "2 December 2027 (extended from August 2026)",
      what:
        "You use AI in a high-risk context (hiring, credit, or critical infrastructure). This triggers the full Annex III compliance package: risk management system, technical documentation, human oversight procedures, logging, and in some cases a conformity assessment. The deadline was extended 16 months, giving you time to prepare properly.",
    });
  }

  // Annex IV — technical documentation for providers
  if (isProvider) {
    obligations.push({
      article:  "Annex IV + Article 11",
      title:    "Technical Documentation (Providers)",
      status:   "EXTENDED",
      deadline: "2 December 2027 / 2 August 2028 (product-embedded AI)",
      what:
        "As a provider (builder) of AI systems, you must maintain detailed technical documentation covering intended purpose, system architecture, training data, performance metrics, and risk assessment. This is distinct from deployer obligations.",
    });
  }

  // Article 6/7 — AI system register (deployers)
  if (usesAI && a.orgRole !== "PROVIDER") {
    obligations.push({
      article:  "Articles 6–7",
      title:    "AI System Register",
      status:   "IN_FORCE",
      deadline: "In force since 2 August 2026",
      what:
        "Organisations deploying AI systems must maintain a register of all AI systems in use, including their purpose, risk level, and the department responsible. This is required for any AI system, not just high-risk ones.",
    });
  }

  // Calculate urgency score
  let score = 20; // base for EU presence
  if (usesAI) score += 20;
  if (hasCustomerFacing) score += 15;
  if (hasSyntheticMedia) score += 10;
  if (isHighRisk) score += 25;
  if (isProvider) score += 10;
  score = Math.min(score, 100);

  const applies = a.location === "OUTSIDE_EU" ? "NO" : usesAI ? "YES" : "MAYBE";

  const headline = isHighRisk
    ? "The EU AI Act applies, including high-risk obligations"
    : usesAI
    ? "The EU AI Act applies to your organisation"
    : "The EU AI Act likely applies. Confirm your AI tool usage";

  const summary = isHighRisk
    ? `Your organisation uses AI in a high-risk context (${a.highRisk.join(", ").toLowerCase().replace(/_/g, " ")}). This triggers significant obligations beyond basic literacy requirements. The good news: the Annex III deadline was extended to December 2027, giving you more time to build proper compliance foundations. Article 4 and transparency obligations apply right now, though.`
    : `Your organisation uses AI tools in an EU context. Article 4 (AI literacy) and the AI system register obligations apply now. Article 5's prohibited practices apply now. You have time to prepare for any high-risk obligations before December 2027. The right approach is to build your compliance foundations while the regulatory pressure is lower, not scramble when deadlines arrive.`;

  return { applies, headline, summary, obligations, score, size: a.size };
}

// ─── Step components ──────────────────────────────────────────────────────────

const STEPS = ["Location", "Your role", "AI tools", "High-risk?", "Size"];

function ProgressBar({ step }: { step: number }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", gap: 0, marginBottom: 10 }}>
        {STEPS.map((label, i) => (
          <div key={i} style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: i < step ? "var(--success)" : i === step ? "var(--btn-primary-bg)" : "var(--border)",
                color: i <= step ? "var(--btn-primary-text)" : "var(--text-muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 600, fontFamily: "IBM Plex Mono, monospace",
                flexShrink: 0,
              }}>
                {i < step ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 10, color: i === step ? "var(--text-primary)" : "var(--text-muted)", fontWeight: i === step ? 600 : 400, textAlign: "center" }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ height: 2, flex: 1, background: i < step ? "var(--success)" : "var(--border)", marginTop: -16 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Option({
  label, sub, selected, onClick,
}: { label: string; sub?: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card-hover" style={{
      display: "flex", alignItems: "flex-start", gap: 12,
      padding: "14px 16px", border: "1.5px solid",
      borderColor: selected ? "var(--btn-primary-bg)" : "var(--border)",
      borderRadius: 10, background: selected ? "var(--bg-subtle)" : "var(--bg-card)",
      cursor: "pointer", textAlign: "left", width: "100%",
      marginBottom: 8, fontFamily: "Inter, sans-serif",
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
        border: "1.5px solid", borderColor: selected ? "var(--btn-primary-bg)" : "var(--border-strong)",
        background: selected ? "var(--btn-primary-bg)" : "var(--bg-card)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {selected && <span style={{ color: "var(--btn-primary-text)", fontSize: 11 }}>✓</span>}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.5 }}>{sub}</div>}
      </div>
    </button>
  );
}

// ─── Result display ───────────────────────────────────────────────────────────

function ResultCard({ result }: { result: Result }) {
  const config = {
    YES:   { bg: "var(--danger-bg)",  border: "var(--danger-border)",  icon: "⚠️", colour: "var(--danger)" },
    MAYBE: { bg: "var(--warning-bg)", border: "var(--warning-border)", icon: "🔍", colour: "var(--warning)" },
    NO:    { bg: "var(--success-bg)", border: "var(--success-border)", icon: "✓",  colour: "var(--success)" },
  }[result.applies];

  const STATUS_CONFIG = {
    IN_FORCE: { label: "IN FORCE NOW", bg: "var(--danger-bg)",  colour: "var(--danger)" },
    UPCOMING: { label: "UPCOMING",     bg: "var(--warning-bg)", colour: "var(--warning)" },
    EXTENDED: { label: "EXTENDED",     bg: "var(--info-bg)",    colour: "var(--info)" },
  };

  return (
    <div>
      {/* Verdict banner */}
      <div style={{
        padding: "20px 24px", borderRadius: 12, marginBottom: 24,
        background: config.bg, border: `1px solid ${config.border}`,
        display: "flex", alignItems: "flex-start", gap: 14,
      }}>
        <span style={{ fontSize: 28, flexShrink: 0 }}>{config.icon}</span>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: config.colour, fontFamily: "IBM Plex Serif, serif", marginBottom: 8 }}>
            {result.headline}
          </div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>
            {result.summary}
          </p>
        </div>
      </div>

      {/* Obligations */}
      {result.obligations.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14, fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Your obligations
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {result.obligations.map((ob) => {
              const sc = STATUS_CONFIG[ob.status];
              return (
                <div key={ob.article} style={{
                  padding: "16px 18px", background: "var(--bg-card)",
                  border: "1px solid var(--border)", borderRadius: 10,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{
                      fontFamily: "IBM Plex Mono, monospace", fontSize: 10, fontWeight: 600,
                      padding: "2px 8px", borderRadius: 4, background: sc.bg, color: sc.colour,
                      letterSpacing: "0.06em",
                    }}>
                      {sc.label}
                    </span>
                    <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "var(--text-muted)" }}>
                      {ob.article}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{ob.title}</div>
                  <div style={{ fontSize: 12, color: "var(--warning)", fontFamily: "IBM Plex Mono, monospace", marginBottom: 8 }}>
                    {ob.deadline}
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{ob.what}</p>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, textAlign: "center" }}>
            <Link href="/penalty-calculator" className="link-hover" style={{ fontSize: 13, color: "var(--danger)", textDecoration: "none", fontWeight: 600 }}>
              Curious what non-compliance could cost? Calculate your exposure →
            </Link>
          </div>
        </div>
      )}

      {/* CTA */}
      {result.applies !== "NO" && result.size !== "MID" && result.size !== "LARGE" && (
        <div style={{
          padding: "24px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, textAlign: "center",
        }}>
          <div style={{ fontFamily: "IBM Plex Serif, serif", fontSize: 20, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
            Ready to get compliant?
          </div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 20px", lineHeight: 1.6 }}>
            Regulaton generates your compliance documents, tracks your AI tool inventory,
            and monitors regulation changes, so you're never caught off guard.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" className="btn-green" style={{
              padding: "11px 24px", background: "#059669", color: "white",
              borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none",
            }}>
              Start free · 14 days →
            </Link>
            <Link href="/" className="btn-outline-dark" style={{
              padding: "11px 20px", background: "transparent", color: "var(--text-secondary)",
              border: "1px solid var(--border)", borderRadius: 8,
              fontSize: 14, textDecoration: "none",
            }}>
              Learn more
            </Link>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)", fontFamily: "IBM Plex Mono, monospace" }}>
            No credit card needed · No lawyer required · Takes only minutes
          </div>
        </div>
      )}

      {/* Org is larger than Regulaton's self-serve plans currently support */}
      {result.applies !== "NO" && (result.size === "MID" || result.size === "LARGE") && (
        <div style={{
          padding: "24px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, textAlign: "center",
        }}>
          <div style={{ fontFamily: "IBM Plex Serif, serif", fontSize: 20, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
            Let's talk about fit first
          </div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 20px", lineHeight: 1.6 }}>
            Regulaton's self-serve plans are built for organisations up to 249 employees.
            At your size ({result.size === "MID" ? "250–749" : "750+"} employees), your obligations are likely more complex than
            a self-serve tool can fully cover — reach out and we'll tell you honestly whether we're a fit or point you
            somewhere better suited.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="mailto:hello@regulaton.com?subject=Enterprise%20inquiry" className="btn-green" style={{
              padding: "11px 24px", background: "#059669", color: "white",
              borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none",
            }}>
              Contact us →
            </a>
            <Link href="/" className="btn-outline-dark" style={{
              padding: "11px 20px", background: "transparent", color: "var(--text-secondary)",
              border: "1px solid var(--border)", borderRadius: 8,
              fontSize: 14, textDecoration: "none",
            }}>
              Learn more
            </Link>
          </div>
        </div>
      )}

      {result.applies === "NO" && (
        <div style={{
          padding: "20px 24px", background: "var(--success-bg)", border: "1px solid var(--success-border)",
          borderRadius: 12, textAlign: "center",
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--success)", marginBottom: 6 }}>
            No action required right now
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 16px", lineHeight: 1.6 }}>
            If your organisation expands into EU markets or starts serving EU customers, re-run this check.
            The AI Act's scope is broad, and it applies wherever the AI's impact is felt.
          </p>
          <Link href="/" className="link-hover" style={{ fontSize: 13, color: "#059669", textDecoration: "none", fontWeight: 500 }}>
            Learn more about Regulaton →
          </Link>
        </div>
      )}

      {/* Share / restart */}
      <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
        <button
          onClick={() => window.location.reload()}
          className="link-hover"
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, color: "var(--text-muted)", fontFamily: "Inter, sans-serif",
            textDecoration: "underline",
          }}
        >
          ↩ Start over
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CheckPage() {
  const [step, setStep]     = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [answers, setAnswers] = useState<Answers>({
    location: "", orgRole: "", tools: [], highRisk: [], size: "",
  });

  function toggleMulti(field: "tools" | "highRisk", value: string) {
    setAnswers((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  }

  function next() {
    if (step < 4) setStep(step + 1);
    else setResult(calculateResult(answers));
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  const canNext = [
    !!answers.location,
    !!answers.orgRole,
    true, // tools can be empty (no AI tools)
    true, // high-risk can be empty
    !!answers.size,
  ][step];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "Inter, sans-serif" }}>
      {/* Nav */}
      <nav style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
        <div className="px-4 sm:px-6" style={{ maxWidth: 760, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ fontFamily: "IBM Plex Serif, serif", fontSize: 18, fontWeight: 600, color: "var(--text-primary)", textDecoration: "none" }}>
            Regula<span style={{ color: "#059669" }}>ton</span>
          </Link>
          <Link href="/login" className="nav-link-hover" style={{ fontSize: 13, color: "var(--text-secondary)", textDecoration: "none" }}>
            Sign in
          </Link>
        </div>
      </nav>

      <div className="px-4 sm:px-6 py-9 sm:py-12" style={{ maxWidth: 620, margin: "0 auto", paddingBottom: 80 }}>
        {!result ? (
          <>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                Free · No login required · 2 minutes
              </div>
              <h1 style={{ fontFamily: "IBM Plex Serif, serif", fontSize: 32, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
                Does the EU AI Act apply to you?
              </h1>
              <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0, lineHeight: 1.65 }}>
                Answer 5 questions. Get a plain-language verdict with specific article references — no sign-up required.
              </p>
            </div>

            <div className="p-5 sm:p-8" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14 }}>
              <ProgressBar step={step} />

              {/* Step 0 — Location */}
              {step === 0 && (
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", fontFamily: "IBM Plex Serif, serif", marginBottom: 6 }}>
                    Where does your organisation operate?
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px", lineHeight: 1.5 }}>
                    The AI Act applies based on where the AI's impact is felt, not where you're headquartered.
                  </p>
                  {[
                    { value: "EU_INSIDE",    label: "We're based in the EU/EEA",                      sub: "Including UK, Norway, Iceland, and Switzerland" },
                    { value: "EU_CUSTOMERS", label: "We're outside the EU but have EU customers or staff", sub: "The Act applies based on impact, not company location" },
                    { value: "OUTSIDE_EU",   label: "We operate entirely outside the EU",             sub: "No EU customers, employees, or market presence" },
                  ].map((o) => (
                    <Option key={o.value} label={o.label} sub={o.sub}
                      selected={answers.location === o.value}
                      onClick={() => setAnswers((a) => ({ ...a, location: o.value }))} />
                  ))}
                </div>
              )}

              {/* Step 1 — Role */}
              {step === 1 && (
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", fontFamily: "IBM Plex Serif, serif", marginBottom: 6 }}>
                    What is your organisation's relationship with AI?
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px", lineHeight: 1.5 }}>
                    The Act distinguishes between organisations that use AI (deployers) and those that build it (providers). Different obligations apply.
                  </p>
                  {[
                    { value: "DEPLOYER", label: "We use AI tools built by others",         sub: "ChatGPT, HubSpot AI, Zoom AI Companion, etc. (most SMBs are deployers)" },
                    { value: "PROVIDER", label: "We build or sell AI systems",              sub: "We develop AI features, models, or products used by others" },
                    { value: "BOTH",     label: "Both: we use and build AI",              sub: "We use third-party AI and also develop our own AI systems" },
                  ].map((o) => (
                    <Option key={o.value} label={o.label} sub={o.sub}
                      selected={answers.orgRole === o.value}
                      onClick={() => setAnswers((a) => ({ ...a, orgRole: o.value }))} />
                  ))}
                </div>
              )}

              {/* Step 2 — Tools */}
              {step === 2 && (
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", fontFamily: "IBM Plex Serif, serif", marginBottom: 6 }}>
                    Which types of AI does your organisation use?
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 6px", lineHeight: 1.5 }}>
                    Select all that apply. Select none if you don't currently use AI tools.
                  </p>
                  <div style={{ fontSize: 12, color: "var(--warning)", marginBottom: 16 }}>
                    Tip: even if you just use ChatGPT for writing, that counts.
                  </div>
                  {[
                    { value: "WRITING",      label: "Writing / content generation",        sub: "ChatGPT, Claude, Gemini, Grammarly, Jasper" },
                    { value: "CHATBOT",      label: "Customer-facing chatbot or assistant", sub: "AI that talks to your customers (transparency obligations apply)" },
                    { value: "RECRUITING",   label: "Recruiting or HR tools with AI",      sub: "Workable AI, HireVue, LinkedIn Recruiter AI" },
                    { value: "ANALYTICS",    label: "Analytics or decision support",       sub: "AI that informs business decisions" },
                    { value: "IMAGE_VIDEO",  label: "Image or video generation",           sub: "Midjourney, DALL-E, Synthesia (labelling obligations apply)" },
                    { value: "CODE",         label: "Coding assistants",                   sub: "GitHub Copilot, Cursor, Tabnine" },
                    { value: "OTHER",        label: "Other AI tools",                      sub: "Any other AI in your operations" },
                  ].map((o) => (
                    <Option key={o.value} label={o.label} sub={o.sub}
                      selected={answers.tools.includes(o.value)}
                      onClick={() => toggleMulti("tools", o.value)} />
                  ))}
                </div>
              )}

              {/* Step 3 — High-risk contexts */}
              {step === 3 && (
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", fontFamily: "IBM Plex Serif, serif", marginBottom: 6 }}>
                    Do you use AI in any of these high-risk contexts?
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px", lineHeight: 1.5 }}>
                    These trigger the most significant obligations under Annex III. Select all that apply, or none.
                  </p>
                  {[
                    { value: "HIRING",          label: "Hiring or HR decisions",            sub: "AI that screens, ranks, or influences decisions about job candidates or employees" },
                    { value: "CREDIT",           label: "Credit or financial access",        sub: "AI used to assess creditworthiness or determine access to financial products" },
                    { value: "CRITICAL_INFRA",   label: "Critical infrastructure",          sub: "Energy, water, transport, or digital infrastructure management" },
                    { value: "LAW_ENFORCEMENT",  label: "Law enforcement or legal contexts", sub: "AI assisting with law enforcement, judicial, or legal decision-making" },
                    { value: "NONE",             label: "None of the above",                sub: "My AI use doesn't fall into any high-risk Annex III category" },
                  ].map((o) => (
                    <Option key={o.value} label={o.label} sub={o.sub}
                      selected={o.value === "NONE" ? answers.highRisk.includes("NONE") : answers.highRisk.includes(o.value)}
                      onClick={() => {
                        if (o.value === "NONE") {
                          setAnswers((a) => ({ ...a, highRisk: a.highRisk.includes("NONE") ? [] : ["NONE"] }));
                        } else {
                          setAnswers((a) => ({
                            ...a,
                            highRisk: a.highRisk.includes(o.value)
                              ? a.highRisk.filter((v) => v !== o.value)
                              : [...a.highRisk.filter((v) => v !== "NONE"), o.value],
                          }));
                        }
                      }} />
                  ))}
                </div>
              )}

              {/* Step 4 — Size */}
              {step === 4 && (
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", fontFamily: "IBM Plex Serif, serif", marginBottom: 6 }}>
                    How large is your organisation?
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px", lineHeight: 1.5 }}>
                    SMEs (&lt;250 employees) have lighter documentation obligations in some contexts.
                    Since June 2026, "small mid-caps" (&lt;750 employees, ≤€150M turnover) also benefit from simplified frameworks.
                  </p>
                  {[
                    { value: "MICRO",  label: "1–9 employees",    sub: "Micro enterprise" },
                    { value: "SMALL",  label: "10–49 employees",  sub: "Small enterprise" },
                    { value: "MEDIUM", label: "50–249 employees", sub: "Medium enterprise (SME)" },
                    { value: "MID",    label: "250–749 employees", sub: "Small mid-cap, simplified framework applies" },
                    { value: "LARGE",  label: "750+ employees",   sub: "Large enterprise, full obligations apply" },
                  ].map((o) => (
                    <Option key={o.value} label={o.label} sub={o.sub}
                      selected={answers.size === o.value}
                      onClick={() => setAnswers((a) => ({ ...a, size: o.value }))} />
                  ))}
                </div>
              )}

              {/* Navigation */}
              <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 24 }}>
                <button
                  onClick={back}
                  disabled={step === 0}
                  className={step === 0 ? "" : "btn-ghost"}
                  style={{
                    padding: "10px 20px", background: "var(--bg-card)", color: "var(--text-secondary)",
                    border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13,
                    fontWeight: 500, cursor: step === 0 ? "not-allowed" : "pointer",
                    opacity: step === 0 ? 0.4 : 1, fontFamily: "Inter, sans-serif",
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={next}
                  disabled={!canNext}
                  className={canNext ? "btn-dark" : ""}
                  style={{
                    padding: "10px 24px",
                    background: canNext ? "var(--btn-primary-bg)" : "var(--text-muted)",
                    color: "var(--btn-primary-text)", border: "none", borderRadius: 8,
                    fontSize: 13, fontWeight: 600,
                    cursor: canNext ? "pointer" : "not-allowed",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {step === 4 ? "Get my results →" : "Continue →"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <h1 style={{ fontFamily: "IBM Plex Serif, serif", fontSize: 28, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 8px" }}>
                Your EU AI Act assessment
              </h1>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
                Based on your answers · Not legal advice
              </p>
            </div>
            <ResultCard result={result} />
          </>
        )}
      </div>
    </div>
  );
}
