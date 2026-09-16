"use client";
// components/onboarding/Wizard.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface LibraryTool {
  id: string;
  name: string;
  providerCompany: string;
  category: string;
  defaultRiskLevel: string;
  riskRationale: string | null;
  complianceNotes: string | null;
  logoSlug: string | null;
}

interface SelectedTool extends LibraryTool {
  department?: string;
  usageDescription?: string;
  accountablePerson?: string;
  accountableEmail?: string;
  oversightProcedure?: string;
  riskLevelOverride?: string;
}

interface OrgDetails {
  name: string;
  country: string;
  industry: string;
  employeeCount: string;
  orgRole: "DEPLOYER" | "PROVIDER" | "BOTH";
}

const EU_COUNTRIES = [
  { code: "AT", name: "Austria" }, { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" }, { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czechia" }, { code: "DE", name: "Germany" },
  { code: "DK", name: "Denmark" }, { code: "EE", name: "Estonia" },
  { code: "ES", name: "Spain" }, { code: "FI", name: "Finland" },
  { code: "FR", name: "France" }, { code: "GR", name: "Greece" },
  { code: "HR", name: "Croatia" }, { code: "HU", name: "Hungary" },
  { code: "IE", name: "Ireland" }, { code: "IT", name: "Italy" },
  { code: "LT", name: "Lithuania" }, { code: "LU", name: "Luxembourg" },
  { code: "LV", name: "Latvia" }, { code: "MT", name: "Malta" },
  { code: "NL", name: "Netherlands" }, { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" }, { code: "RO", name: "Romania" },
  { code: "SE", name: "Sweden" }, { code: "SI", name: "Slovenia" },
  { code: "SK", name: "Slovakia" }, { code: "GB", name: "United Kingdom" },
  { code: "NO", name: "Norway" }, { code: "CH", name: "Switzerland" },
];

const INDUSTRIES = [
  "Technology / Software", "Marketing / Advertising", "Legal / Compliance",
  "Finance / Accounting", "Healthcare / Medical", "E-commerce / Retail",
  "Consulting / Professional Services", "Media / Publishing",
  "Education / Training", "Manufacturing", "Logistics / Supply Chain",
  "Real Estate", "Architecture / Design", "HR / Recruitment", "Other",
];

const EMPLOYEE_RANGES = [
  { value: "SOLO",   label: "Just me (1 person)" },
  { value: "MICRO",  label: "2–9 employees" },
  { value: "SMALL",  label: "10–49 employees" },
  { value: "MEDIUM", label: "50–249 employees" },
];

const RISK_COLOURS: Record<string, string> = {
  MINIMAL: "#34D399", LIMITED: "#FBBF24", HIGH: "#F87171", UNACCEPTABLE: "#A78BFA",
};

const RISK_LABELS: Record<string, string> = {
  MINIMAL: "Minimal risk", LIMITED: "Limited risk", HIGH: "High risk", UNACCEPTABLE: "Prohibited",
};

function ProgressBar({ step, total }: { step: number; total: number }) {
  const labels = ["Organisation", "Select tools", "Review risk", "Accountability", "Done"];
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        {labels.map((label, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: i < step ? "var(--success)" : i === step ? "var(--btn-primary-bg)" : "var(--border)",
              color: i <= step ? (i === step ? "var(--btn-primary-text)" : "#0B0E14") : "var(--text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 600, fontFamily: "IBM Plex Mono, monospace",
              border: i === step ? "2px solid var(--btn-primary-bg)" : "none", transition: "all 0.2s",
            }}>
              {i < step ? "✓" : i + 1}
            </div>
            <span style={{
              fontSize: 11, color: i === step ? "var(--text-primary)" : "var(--text-muted)",
              fontWeight: i === step ? 600 : 400, textAlign: "center",
              display: i === step ? "block" : "none",
            }}>
              {label}
            </span>
          </div>
        ))}
      </div>
      <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 2, background: "var(--success)",
          width: `${(step / (total - 1)) * 100}%`, transition: "width 0.4s ease",
        }} />
      </div>
    </div>
  );
}

function StepOrgDetails({ data, onChange, onNext }: { data: OrgDetails; onChange: (d: OrgDetails) => void; onNext: () => void }) {
  const isValid = data.name.trim().length > 1 && data.country && data.employeeCount;
  return (
    <div>
      <h2 style={S.stepTitle}>Tell us about your organisation</h2>
      <p style={S.stepSub}>We use this to tailor your compliance obligations.</p>
      <div style={S.field}>
        <label style={S.label}>Organisation name</label>
        <input style={S.input} placeholder="Acme GmbH" value={data.name} onChange={(e) => onChange({ ...data, name: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 16 }}>
        <div style={S.field}>
          <label style={S.label}>Country</label>
          <select style={S.input} value={data.country} onChange={(e) => onChange({ ...data, country: e.target.value })}>
            <option value="">Select country</option>
            {EU_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>
        <div style={S.field}>
          <label style={S.label}>Industry</label>
          <select style={S.input} value={data.industry} onChange={(e) => onChange({ ...data, industry: e.target.value })}>
            <option value="">Select industry</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>
      <div style={S.field}>
        <label style={S.label}>Organisation size</label>
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 10 }}>
          {EMPLOYEE_RANGES.map((r) => (
            <button key={r.value} className="card-hover" style={{ ...S.optionBtn, ...(data.employeeCount === r.value ? S.optionBtnSelected : {}) }}
              onClick={() => onChange({ ...data, employeeCount: r.value })}>{r.label}</button>
          ))}
        </div>
      </div>
      <div style={S.field}>
        <label style={S.label}>Your organisation's AI role</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {([
            { value: "DEPLOYER", label: "We use AI tools (ChatGPT, CRM AI, etc.) but don't build AI systems", emoji: "🔧" },
            { value: "PROVIDER", label: "We build or sell AI systems to others", emoji: "🏗️" },
            { value: "BOTH",     label: "We do both", emoji: "⚡" },
          ] as const).map((opt) => (
            <button key={opt.value} className="card-hover" style={{ ...S.optionBtn, textAlign: "left", ...(data.orgRole === opt.value ? S.optionBtnSelected : {}) }}
              onClick={() => onChange({ ...data, orgRole: opt.value })}>{opt.emoji} {opt.label}</button>
          ))}
        </div>
        {data.orgRole === "DEPLOYER" && (
          <div style={S.infoBox}>✓ Most SMBs are deployers. Your obligations are lighter, mainly documentation, transparency, and staff training.</div>
        )}
      </div>
      <button className={isValid ? "btn-dark" : ""} style={{ ...S.btn, ...(isValid ? {} : S.btnDisabled) }} onClick={onNext} disabled={!isValid}>Continue →</button>
    </div>
  );
}

function StepToolSelection({ libraryTools, selectedTools, onToggle, onNext, onBack }: {
  libraryTools: LibraryTool[]; selectedTools: SelectedTool[];
  onToggle: (t: LibraryTool) => void; onNext: () => void; onBack: () => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const categories = ["ALL", ...Array.from(new Set(libraryTools.map((t) => t.category)))];
  const filtered = libraryTools.filter((t) => {
    const ms = t.name.toLowerCase().includes(search.toLowerCase()) || t.providerCompany.toLowerCase().includes(search.toLowerCase());
    return ms && (category === "ALL" || t.category === category);
  });
  const isSelected = (id: string) => selectedTools.some((t) => t.id === id);
  const catLabel = (cat: string) => cat === "ALL" ? "All" : cat.split("_").map((w) => w[0] + w.slice(1).toLowerCase()).join(" ");
  return (
    <div>
      <h2 style={S.stepTitle}>Which AI tools does your organisation use?</h2>
      <p style={S.stepSub}>We've pre-classified {libraryTools.length} common tools. Tick everything your team uses.</p>
      <input style={{ ...S.input, marginBottom: 12 }} placeholder="Search tools..." value={search} onChange={(e) => setSearch(e.target.value)} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {categories.slice(0, 8).map((cat) => (
          <button key={cat} className="card-hover" onClick={() => setCategory(cat)} style={{
            fontSize: 12, padding: "4px 12px", borderRadius: 20, border: "1px solid",
            borderColor: cat === category ? "var(--btn-primary-bg)" : "var(--border)",
            background: cat === category ? "var(--btn-primary-bg)" : "transparent",
            color: cat === category ? "var(--btn-primary-text)" : "var(--text-muted)", cursor: "pointer", fontWeight: 500,
          }}>{catLabel(cat)}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 8, maxHeight: 380, overflowY: "auto" }}>
        {filtered.map((tool) => {
          const selected = isSelected(tool.id);
          return (
            <button key={tool.id} onClick={() => onToggle(tool)} className="card-hover" style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
              borderRadius: 8, cursor: "pointer", border: "1.5px solid", textAlign: "left",
              borderColor: selected ? "var(--btn-primary-bg)" : "var(--border)", background: selected ? "var(--bg-subtle)" : "var(--bg-card)",
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 4, flexShrink: 0, border: "1.5px solid",
                borderColor: selected ? "var(--btn-primary-bg)" : "var(--border-strong)", background: selected ? "var(--btn-primary-bg)" : "var(--bg-card)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {selected && <span style={{ color: "var(--btn-primary-text)", fontSize: 11 }}>✓</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tool.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{tool.providerCompany}</span>
                  <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: `${RISK_COLOURS[tool.defaultRiskLevel]}22`, color: RISK_COLOURS[tool.defaultRiskLevel], fontWeight: 600, fontFamily: "IBM Plex Mono, monospace" }}>
                    {RISK_LABELS[tool.defaultRiskLevel]}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {selectedTools.length > 0 && (
        <div style={{ marginTop: 16, padding: "10px 14px", background: "var(--success-bg)", borderRadius: 8, fontSize: 13, color: "var(--success)", fontWeight: 500 }}>
          ✓ {selectedTools.length} tool{selectedTools.length === 1 ? "" : "s"} selected
        </div>
      )}
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button className="btn-ghost" style={S.btnBack} onClick={onBack}>← Back</button>
        <button className={selectedTools.length === 0 ? "" : "btn-dark"} style={{ ...S.btn, ...(selectedTools.length === 0 ? S.btnDisabled : {}) }} onClick={onNext} disabled={selectedTools.length === 0}>
          Continue with {selectedTools.length} tool{selectedTools.length === 1 ? "" : "s"} →
        </button>
      </div>
    </div>
  );
}

function StepReviewRisk({ selectedTools, onUpdateTool, onNext, onBack }: {
  selectedTools: SelectedTool[]; onUpdateTool: (id: string, u: Partial<SelectedTool>) => void;
  onNext: () => void; onBack: () => void;
}) {
  const highRisk = selectedTools.filter((t) => (t.riskLevelOverride ?? t.defaultRiskLevel) === "HIGH");
  return (
    <div>
      <h2 style={S.stepTitle}>Review risk classifications</h2>
      <p style={S.stepSub}>We've classified each tool based on the EU AI Act. Review and override if needed.</p>
      {highRisk.length > 0 && (
        <div style={{ padding: "12px 16px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: 8, marginBottom: 20 }}>
          <div style={{ fontWeight: 600, color: "var(--danger)", fontSize: 13, marginBottom: 4 }}>⚠️ {highRisk.length} high-risk tool{highRisk.length === 1 ? "" : "s"} detected</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{highRisk.map((t) => t.name).join(", ")} require{highRisk.length === 1 ? "s" : ""} formal oversight procedures under Annex III.</div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {selectedTools.map((tool) => {
          const risk = tool.riskLevelOverride ?? tool.defaultRiskLevel;
          return (
            <div key={tool.id} style={{ border: "1px solid", borderColor: risk === "HIGH" ? "var(--danger-border)" : "var(--border)", borderRadius: 10, padding: "14px 16px", background: risk === "HIGH" ? "var(--danger-bg)" : "var(--bg-card)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{tool.name}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{tool.providerCompany}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{tool.riskRationale}</p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, background: `${RISK_COLOURS[risk]}22`, color: RISK_COLOURS[risk], fontWeight: 600, fontFamily: "IBM Plex Mono, monospace" }}>
                    {RISK_LABELS[risk]}
                  </span>
                  {tool.riskLevelOverride && (
                    <button className="link-hover" style={{ display: "block", fontSize: 10, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", marginTop: 4 }}
                      onClick={() => onUpdateTool(tool.id, { riskLevelOverride: undefined })}>↩ Reset</button>
                  )}
                </div>
              </div>
              {risk === "HIGH" && (
                <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--warning-bg)", borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: "var(--warning)", fontWeight: 600, marginBottom: 4 }}>What you'll need to do:</div>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>{tool.complianceNotes}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button className="btn-ghost" style={S.btnBack} onClick={onBack}>← Back</button>
        <button className="btn-dark" style={S.btn} onClick={onNext}>Looks good, continue →</button>
      </div>
    </div>
  );
}

function StepAccountability({ selectedTools, onUpdateTool, onNext, onBack }: {
  selectedTools: SelectedTool[]; onUpdateTool: (id: string, u: Partial<SelectedTool>) => void;
  onNext: () => void; onBack: () => void;
}) {
  const highRisk = selectedTools.filter((t) => (t.riskLevelOverride ?? t.defaultRiskLevel) === "HIGH");
  const [gPerson, setGPerson] = useState("");
  const [gEmail, setGEmail]   = useState("");
  const applyAll = () => selectedTools.forEach((t) => onUpdateTool(t.id, { accountablePerson: gPerson, accountableEmail: gEmail }));
  return (
    <div>
      <h2 style={S.stepTitle}>Set accountability</h2>
      <p style={S.stepSub}>The EU AI Act requires a named person responsible for AI compliance.</p>
      <div style={{ padding: "16px", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 10, marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>Apply to all tools</div>
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
          <input style={S.input} placeholder="Full name" value={gPerson} onChange={(e) => setGPerson(e.target.value)} />
          <input style={S.input} placeholder="Email address" type="email" value={gEmail} onChange={(e) => setGEmail(e.target.value)} />
        </div>
        <button className={!gPerson || !gEmail ? "" : "btn-dark"} style={{ marginTop: 10, fontSize: 13, fontWeight: 500, padding: "7px 16px", background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", border: "none", borderRadius: 6, cursor: "pointer" }}
          onClick={applyAll} disabled={!gPerson || !gEmail}>Apply to all {selectedTools.length} tools</button>
      </div>
      {highRisk.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--danger)", marginBottom: 12 }}>⚠️ High-risk tools also need oversight procedures</div>
          {highRisk.map((tool) => (
            <div key={tool.id} style={{ border: "1px solid var(--danger-border)", borderRadius: 10, padding: "14px 16px", marginBottom: 12, background: "var(--danger-bg)" }}>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14, marginBottom: 12 }}>{tool.name}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 10, marginBottom: 10 }}>
                <div style={S.field}>
                  <label style={S.label}>Accountable person</label>
                  <input style={S.input} placeholder="Full name" value={tool.accountablePerson ?? ""} onChange={(e) => onUpdateTool(tool.id, { accountablePerson: e.target.value })} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Email</label>
                  <input style={S.input} placeholder="name@company.com" type="email" value={tool.accountableEmail ?? ""} onChange={(e) => onUpdateTool(tool.id, { accountableEmail: e.target.value })} />
                </div>
              </div>
              <div style={S.field}>
                <label style={S.label}>Human oversight procedure (required)</label>
                <textarea style={{ ...S.input, height: 80, resize: "vertical" }}
                  placeholder="Describe how AI outputs are reviewed before decisions are made. Who reviews? How can they override?"
                  value={tool.oversightProcedure ?? ""}
                  onChange={(e) => onUpdateTool(tool.id, { oversightProcedure: e.target.value })} />
              </div>
            </div>
          ))}
        </>
      )}
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button className="btn-ghost" style={S.btnBack} onClick={onBack}>← Back</button>
        <button className="btn-dark" style={S.btn} onClick={onNext}>Generate my compliance documents →</button>
      </div>
    </div>
  );
}

function StepGenerating({ orgName }: { orgName: string }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>⚡</div>
      <h2 style={{ ...S.stepTitle, textAlign: "center" }}>Setting up {orgName}</h2>
      <p style={{ ...S.stepSub, textAlign: "center" }}>Generating your compliance documents…</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 360, margin: "32px auto 0" }}>
        {[
          "Creating your organisation profile",
          "Adding tools to your inventory",
          "Generating Acceptable Use Policy",
          "Generating AI System Register",
          "Generating Training Record template",
          "Calculating your compliance score",
        ].map((label, i, arr) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%",
              background: i < arr.length - 1 ? "var(--success-bg)" : "var(--bg-subtle)",
              border: `1.5px solid ${i < arr.length - 1 ? "var(--success)" : "var(--border)"}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
            }}>
              {i < arr.length - 1 ? "✓" : "·"}
            </div>
            <span style={{ fontSize: 13, color: i < arr.length - 1 ? "var(--success)" : "var(--text-muted)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Wizard ───────────────────────────────────────────────────────────

export function OnboardingWizard({ libraryTools }: { libraryTools: LibraryTool[] }) {
  const router = useRouter();
  const { update } = useSession(); // force JWT refresh after org is created
  const [step, setStep] = useState(0);

  const [orgDetails, setOrgDetails] = useState<OrgDetails>({
    name: "", country: "", industry: "", employeeCount: "", orgRole: "DEPLOYER",
  });
  const [selectedTools, setSelectedTools] = useState<SelectedTool[]>([]);

  function toggleTool(tool: LibraryTool) {
    setSelectedTools((prev) =>
      prev.some((t) => t.id === tool.id) ? prev.filter((t) => t.id !== tool.id) : [...prev, { ...tool }]
    );
  }

  function updateTool(id: string, updates: Partial<SelectedTool>) {
    setSelectedTools((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }

  async function handleSubmit() {
    setStep(4);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgDetails, tools: selectedTools }),
      });
      if (!res.ok) throw new Error("Failed");

      // Force JWT to re-read orgId from DB so middleware lets us through
      await update();

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setStep(3);
    }
  }

  if (step === 4) return <div className="px-4 py-8 sm:px-6 sm:py-10" style={S.wizard}><StepGenerating orgName={orgDetails.name} /></div>;

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10" style={S.wizard}>
      <ProgressBar step={step} total={5} />
      {step === 0 && <StepOrgDetails data={orgDetails} onChange={setOrgDetails} onNext={() => setStep(1)} />}
      {step === 1 && <StepToolSelection libraryTools={libraryTools} selectedTools={selectedTools} onToggle={toggleTool} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
      {step === 2 && <StepReviewRisk selectedTools={selectedTools} onUpdateTool={updateTool} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && <StepAccountability selectedTools={selectedTools} onUpdateTool={updateTool} onNext={handleSubmit} onBack={() => setStep(2)} />}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wizard:          { maxWidth: 680, margin: "0 auto", fontFamily: "Inter, sans-serif" },
  stepTitle:       { fontFamily: "IBM Plex Serif, serif", fontSize: 26, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8, letterSpacing: "-0.02em" },
  stepSub:         { fontSize: 15, color: "var(--text-secondary)", marginBottom: 28, lineHeight: 1.65 },
  field:           { display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 },
  label:           { fontSize: 13, fontWeight: 500, color: "var(--text-primary)" },
  input:           { padding: "9px 12px", borderRadius: 6, border: "1.5px solid var(--border)", fontSize: 14, color: "var(--text-primary)", background: "var(--bg-card)", outline: "none", fontFamily: "Inter, sans-serif", width: "100%" },
  optionBtn:       { padding: "11px 14px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg-card)", fontSize: 14, color: "var(--text-primary)", cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 400 },
  optionBtnSelected: { borderColor: "var(--btn-primary-bg)", background: "var(--bg-subtle)", fontWeight: 500 },
  infoBox:         { marginTop: 10, padding: "10px 14px", background: "var(--success-bg)", borderRadius: 8, fontSize: 13, color: "var(--success)" },
  btn:             { padding: "12px 24px", borderRadius: 8, border: "none", background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" },
  btnDisabled:     { background: "var(--text-muted)", cursor: "not-allowed" },
  btnBack:         { padding: "12px 20px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" },
};
