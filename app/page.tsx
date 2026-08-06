// app/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MarketingNav } from "@/components/shared/MarketingNav";
import { PLANS } from "@/lib/plans";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.hasOrg)   redirect("/dashboard");
  if (session?.user?.id) redirect("/onboarding");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "Inter, sans-serif" }}>

      {/* Nav */}
      <MarketingNav />

      {/* Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-2 px-4 sm:px-6 py-16 sm:py-20 lg:py-16" style={{ maxWidth: 1100, margin: "0 auto", gap: 48, alignItems: "center" }}>
        <div className="text-center lg:text-left">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "IBM Plex Mono, monospace", fontSize: 13, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-primary)", padding: "5px 12px", borderRadius: 20, marginBottom: 20 }}>
            <span className="blink-dot" style={{ width: 8, height: 8, background: "#DC2626", borderRadius: "50%", display: "inline-block" }} />
            EU AI Act · Article 4 in force now
          </div>
          <h1 className="text-[34px] sm:text-[44px] lg:text-[52px]" style={{ fontFamily: "IBM Plex Serif, serif", fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--text-primary)", margin: "0 0 20px" }}>
            Build your AI compliance foundation{" "}
            <em style={{ fontStyle: "italic", color: "#059669" }}>before</em>{" "}
            you need it.
          </h1>
          <p className="mx-auto lg:mx-0" style={{ fontSize: 17, color: "var(--text-secondary)", lineHeight: 1.65, margin: "0 0 12px", maxWidth: 460 }}>
            Article 4 (AI literacy) is already in force. Annex III high-risk deadlines have been extended to December 2027, giving you runway to get this right, not a reason to delay.
          </p>
          <p className="mx-auto lg:mx-0" style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 32px", maxWidth: 440 }}>
            Regulaton helps EU SMBs document their AI tool usage, generate required compliance documents, and manage compliance posture over time.
          </p>
          <div className="justify-center lg:justify-start" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/login" className="btn-green" style={{ padding: "13px 28px", background: "#059669", color: "white", borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
              Start free · 14 days
            </Link>
            <Link href="/check" className="btn-outline-dark" style={{ padding: "13px 28px", background: "transparent", color: "var(--text-primary)", border: "1.5px solid var(--text-primary)", borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
              Check if it applies →
            </Link>
          </div>
          <div style={{ marginTop: 28, fontSize: 13, color: "var(--text-muted)" }}>
            No credit card required · Takes only minutes · Built for EU SMBs
          </div>
        </div>

        {/* Score card */}
        <div className="p-6 sm:p-9" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "0 4px 24px rgba(26,35,50,0.06)", position: "relative" }}>
          <div style={{ position: "absolute", top: -10, right: 20, background: "#059669", color: "white", fontFamily: "IBM Plex Mono, monospace", fontSize: 10, fontWeight: 500, letterSpacing: "0.06em", padding: "4px 10px", borderRadius: 20 }}>
            LIVE DASHBOARD
          </div>
          <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 24 }}>
            Your compliance status
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 28 }}>
            <div style={{ width: 100, height: 100, position: "relative", flexShrink: 0 }}>
              <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="50" cy="50" r="44" fill="none" stroke="var(--border)" strokeWidth="8" />
                <circle cx="50" cy="50" r="44" fill="none" stroke="#059669" strokeWidth="8" strokeLinecap="round" strokeDasharray="276" strokeDashoffset="28" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 24, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1 }}>90</span>
                <span style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>/ 100</span>
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "IBM Plex Serif, serif", fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Almost there</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>1 obligation needs attention before you're fully covered.</div>
            </div>
          </div>
          {[
            { label: "AI Literacy (Art. 4)",  status: "COMPLIANT",     colour: "#059669" },
            { label: "Acceptable Use Policy", status: "COMPLIANT",     colour: "#059669" },
            { label: "AI System Register",    status: "COMPLIANT",     colour: "#059669" },
            { label: "Human Oversight",       status: "ACTION NEEDED", colour: "#D97706" },
            { label: "Vendor Due Diligence",  status: "COMPLIANT",     colour: "#059669" },
          ].map((row) => (
            <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--bg-subtle)", borderRadius: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{row.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: row.colour }} />
                <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, fontWeight: 500, color: row.colour, letterSpacing: "0.03em" }}>{row.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Regulatory timeline — deliberately dark accent panel, stays dark in both themes */}
      <section className="px-4 sm:px-6" style={{ paddingBottom: 64 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="p-5 sm:p-8" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14 }}>
            <div className="text-center lg:text-left" style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
              Regulatory timeline: what's actually required and when
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 16 }}>
              {[
                { date: "Feb 2025",  label: "Article 4 & 5", status: "IN FORCE", colour: "#DC2626", sub: "AI literacy + prohibited practices." },
                { date: "Aug 2026",  label: "Article 50",    status: "IN FORCE", colour: "#DC2626", sub: "Transparency: chatbots must disclose AI nature." },
                { date: "Dec 2026",  label: "Article 50 Media", status: "UPCOMING", colour: "#D97706", sub: "AI-generated content labelling for existing systems." },
                { date: "Dec 2027",  label: "Annex III",     status: "EXTENDED", colour: "#3B82F6", sub: "High-risk AI obligations." },
              ].map((item) => (
                <div key={item.date} style={{ padding: "16px", background: "rgba(255,255,255,0.06)", borderRadius: 10, borderTop: `3px solid ${item.colour}` }}>
                  <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: item.colour, fontWeight: 600, marginBottom: 6 }}>{item.date}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "white", marginBottom: 4 }}>{item.label}</div>
                  <div style={{ display: "inline-block", fontFamily: "IBM Plex Mono, monospace", fontSize: 9, fontWeight: 700, color: item.colour, letterSpacing: "0.08em", marginBottom: 8, padding: "2px 7px", background: `${item.colour}22`, borderRadius: 4 }}>{item.status}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-4 sm:px-6 py-16 sm:py-20" style={{ background: "var(--bg-card)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>How it works</div>
          <h2 className="text-[28px] sm:text-[38px]" style={{ fontFamily: "IBM Plex Serif, serif", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)", margin: "0 0 16px" }}>Compliance management, not a one-time checklist</h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", margin: "0 auto 56px", maxWidth: 520, lineHeight: 1.7 }}>
            Regulaton manages your compliance posture continuously, tracking tools, training, and document currency over time.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 2, background: "var(--border)", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
            {[
              { num: "01", icon: "🏢", title: "Tell us about your organisation",     sub: "Country, industry, employee count. We tailor your obligations.", time: "~2 min" },
              { num: "02", icon: "🔍", title: "Pick the AI tools you use",           sub: "We pre-classify 40+ common tools. Just tick what you use.", time: "~5 min" },
              { num: "03", icon: "⚡", title: "Documents generated automatically",   sub: "AUP, AI System Register, Training Records (auto-filled).", time: "~instant" },
              { num: "04", icon: "🛡️", title: "Stay current as regulations change", sub: "Alerts when your inventory, documents, or obligations need updating.", time: "ongoing" },
            ].map((s) => (
              <div key={s.num} style={{ background: "var(--bg-card)", padding: "32px 24px" }}>
                <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "var(--text-muted)", marginBottom: 16 }}>{s.num}</div>
                <div style={{ fontSize: 28, marginBottom: 16 }} aria-hidden="true">{s.icon}</div>
                <div style={{ fontFamily: "IBM Plex Serif, serif", fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>{s.title}</div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 16px" }}>{s.sub}</p>
                <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "var(--text-muted)" }}>{s.time}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="px-4 sm:px-6 py-16 sm:py-20">
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>What you get</div>
          <h2 className="text-[28px] sm:text-[38px]" style={{ fontFamily: "IBM Plex Serif, serif", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)", margin: "0 0 48px" }}>Four documents. Every obligation covered.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 16 }}>
            {[
              { accent: "#1A3A8F", ref: "ARTICLE 4 · IN FORCE NOW",      title: "AI Acceptable Use Policy",   desc: "Defines approved AI tools, permitted uses, prohibited uses, and staff obligations." },
              { accent: "#059669", ref: "ARTICLES 6–7 · IN FORCE",        title: "AI System Register",         desc: "A complete inventory of every AI system you use (auto-populated from your inventory)." },
              { accent: "#D97706", ref: "ARTICLE 4 · IN FORCE NOW",      title: "Staff Training Records",     desc: "Documents staff AI literacy training completions as required by Article 4." },
              { accent: "#7C3AED", ref: "ARTICLE 14 · DEADLINE DEC 2027", title: "Human Oversight Procedure", desc: "Required oversight procedures for high-risk AI. Annex III extended: time to prepare properly." },
            ].map((d) => (
              <div key={d.title} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "24px", textAlign: "left", borderLeft: `4px solid ${d.accent}` }}>
                <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: 10 }}>{d.ref}</div>
                <div style={{ fontFamily: "IBM Plex Serif, serif", fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>{d.title}</div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 14px" }}>{d.desc}</p>
                <div style={{ display: "flex", gap: 6 }}>
                  {[".docx", ".pdf", "editable"].map((f) => (
                    <span key={f} style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 sm:px-6 py-16 sm:py-20" style={{ background: "var(--bg-card)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>Pricing</div>
          <h2 className="text-[28px] sm:text-[38px]" style={{ fontFamily: "IBM Plex Serif, serif", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)", margin: "0 0 12px" }}>One flat monthly price. Cancel anytime.</h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", margin: "0 auto 48px", maxWidth: 480 }}>14-day free trial. No credit card required.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 16 }}>
            {(Object.keys(PLANS) as (keyof typeof PLANS)[]).map((key) => {
              const p = PLANS[key];
              return (
                <div key={key} style={{ background: "var(--bg-card)", border: "1.5px solid var(--border-strong)", borderRadius: 14, padding: "28px 24px" }}>
                  <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{p.label}</div>
                  <div style={{ fontFamily: "IBM Plex Serif, serif", fontSize: 36, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                    {p.price.replace("/mo", "")} <span style={{ fontSize: 16, color: "var(--text-muted)", fontFamily: "Inter, sans-serif", fontWeight: 400 }}>/mo</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", margin: "6px 0 24px" }}>{p.employees}</div>
                  <Link href="/login" className="pricing-cta" style={{ display: "block", padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>
                    Start free trial
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA — deliberately dark accent panel, stays dark in both themes */}
      <section className="px-4 sm:px-6" style={{ padding: "80px 0" }}>
        <div className="p-8 sm:p-14" style={{ maxWidth: 1052, margin: "0 auto", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, textAlign: "center" }}>
          <h2 className="text-[26px] sm:text-[36px]" style={{ fontFamily: "IBM Plex Serif, serif", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 14px", letterSpacing: "-0.02em" }}>
            Get started today!<br />
          </h2>
          <p style={{ color: "var(--text-secondary)", margin: "0 0 12px", fontSize: 16, lineHeight: 1.7, maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
            The Annex III deadline was extended to December 2027, but Article 4 (AI literacy) and transparency obligations apply right now.
          </p>
          <p style={{ color: "var(--text-muted)", margin: "0 0 32px", fontSize: 14 }}>
            Regulaton makes regulatory compliance simple, fast, and affordable.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" className="btn-green" style={{ display: "inline-block", padding: "14px 28px", background: "#059669", color: "white", borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
              Start free · no card required
            </Link>
            <Link href="/check" className="btn-outline-dark" style={{ display: "inline-block", padding: "13px 24px", background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 15, textDecoration: "none" }}>
              Check if it applies to you →
            </Link>
          </div>
          <div style={{ marginTop: 16, fontSize: 13, color: "var(--text-muted)", fontFamily: "IBM Plex Mono, monospace" }}>
            14-day free trial · Cancel anytime
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6" style={{ borderTop: "1px solid var(--border)", paddingTop: 28, paddingBottom: 28 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontFamily: "IBM Plex Serif, serif", fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
            Regula<span style={{ color: "#059669" }}>ton</span>
          </span>
          <div style={{ display: "flex", gap: 24 }}>
            <Link href="/check"   className="nav-link-hover" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>Applicability checker</Link>
            <Link href="/privacy" className="nav-link-hover" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>Privacy</Link>
            <Link href="/terms"   className="nav-link-hover" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>Terms</Link>
          </div>
        </div>
        <div style={{ maxWidth: 1100, margin: "12px auto 0", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.7 }}>
          Regulaton is compliance tooling, not legal advice. Documents generated are based on publicly available EU AI Act guidance.
          Regulatory deadlines are accurate as of July 2026. Verify current requirements before relying on them.
          For high-risk AI systems or complex regulatory questions, consider consulting qualified legal counsel.
        </div>
      </footer>
    </div>
  );
}
