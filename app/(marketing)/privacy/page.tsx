// app/(marketing)/privacy/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Regulaton",
  description: "How Regulaton collects, uses, and protects your data.",
};

const EFFECTIVE_DATE = "1 August 2026";
const CONTACT_EMAIL  = "privacy@regulaton.com";
const COMPANY_NAME   = "Regulaton";

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "Inter, sans-serif" }}>
      {/* Nav */}
      <nav style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
        <div className="px-4 sm:px-6" style={{ maxWidth: 800, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ fontFamily: "IBM Plex Serif, serif", fontSize: 18, fontWeight: 600, color: "var(--text-primary)", textDecoration: "none" }}>
            Regula<span style={{ color: "#059669" }}>ton</span>
          </Link>
          <Link href="/login" className="nav-link-hover" style={{ fontSize: 13, color: "var(--text-secondary)", textDecoration: "none" }}>Sign in</Link>
        </div>
      </nav>

      <div className="px-4 sm:px-6 py-9 sm:py-12" style={{ maxWidth: 720, margin: "0 auto", paddingBottom: 80 }}>
        <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
          Legal
        </div>
        <h1 style={{ fontFamily: "IBM Plex Serif, serif", fontSize: 36, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 40px" }}>
          Effective date: {EFFECTIVE_DATE} · Last updated: {EFFECTIVE_DATE}
        </p>

        <div style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.75 }}>

          <Section title="1. Who we are">
            <p>{COMPANY_NAME} ("we", "our", "us") operates the Regulaton platform at regulaton.com. We provide EU AI Act compliance tooling for small and medium businesses.</p>
            <p>For the purposes of the GDPR, {COMPANY_NAME} is the data controller for personal data processed through our platform.</p>
            <p>Contact us about privacy: <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#1A3A8F" }}>{CONTACT_EMAIL}</a></p>
          </Section>

          <Section title="2. Data we collect">
            <p><strong>Account data:</strong> Your name, email address, and authentication data (via GitHub OAuth or email magic link). We use NextAuth to manage authentication.</p>
            <p><strong>Organisation data:</strong> Company name, country, industry, employee count, and VAT number that you provide during onboarding.</p>
            <p><strong>Compliance data:</strong> AI tool inventories, compliance documents, staff training records, and oversight procedures that you create within the platform. This data belongs to you.</p>
            <p><strong>Billing data:</strong> Payment is processed by Stripe. We store your Stripe customer ID and subscription status, but never your card details.</p>
            <p><strong>Usage data:</strong> Standard server logs including IP addresses, browser type, pages visited, and timestamps. We use this to operate and improve the service.</p>
          </Section>

          <Section title="3. How we use your data">
            <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
              <li style={{ marginBottom: 8 }}>To provide the Regulaton service, generating compliance documents, calculating your compliance score, and storing your inventory</li>
              <li style={{ marginBottom: 8 }}>To process payments through Stripe</li>
              <li style={{ marginBottom: 8 }}>To send you service emails (sign-in links, subscription receipts, important updates)</li>
              <li style={{ marginBottom: 8 }}>To improve the platform based on aggregated, anonymised usage patterns</li>
              <li style={{ marginBottom: 8 }}>To comply with our own legal obligations</li>
            </ul>
            <p>We do not sell your data to third parties. We do not use your compliance data to train AI models.</p>
          </Section>

          <Section title="4. Legal basis for processing (GDPR)">
            <p>We process your data on the following legal bases under Article 6 GDPR:</p>
            <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
              <li style={{ marginBottom: 8 }}><strong>Contract (Art. 6(1)(b)):</strong> Processing necessary to provide you with the Regulaton service under our Terms of Service.</li>
              <li style={{ marginBottom: 8 }}><strong>Legitimate interests (Art. 6(1)(f)):</strong> Service improvement, security, and fraud prevention.</li>
              <li style={{ marginBottom: 8 }}><strong>Legal obligation (Art. 6(1)(c)):</strong> Retaining billing records as required by tax law.</li>
            </ul>
          </Section>

          <Section title="5. Data retention">
            <p>We retain your account and compliance data for as long as your account is active. If you close your account, we delete your data within 30 days, except where we are required by law to retain it (e.g. billing records, which we retain for 7 years for tax purposes).</p>
          </Section>

          <Section title="6. Third-party processors">
            <p>We use the following sub-processors to provide our service:</p>
            <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
              <li style={{ marginBottom: 8 }}><strong>Neon</strong> — PostgreSQL database hosting (EU region). Your data is stored in the EU.</li>
              <li style={{ marginBottom: 8 }}><strong>Vercel</strong> — Application hosting and edge network.</li>
              <li style={{ marginBottom: 8 }}><strong>Stripe</strong> — Payment processing. Subject to Stripe's privacy policy.</li>
              <li style={{ marginBottom: 8 }}><strong>Resend</strong> — Transactional email delivery.</li>
              <li style={{ marginBottom: 8 }}><strong>GitHub</strong> — OAuth authentication (if you choose to sign in with GitHub).</li>
            </ul>
            <p>All processors are bound by data processing agreements and provide appropriate safeguards for personal data.</p>
          </Section>

          <Section title="7. Your rights under GDPR">
            <p>As a data subject in the EU/EEA or UK, you have the following rights:</p>
            <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
              <li style={{ marginBottom: 8 }}><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li style={{ marginBottom: 8 }}><strong>Rectification:</strong> Correct inaccurate personal data.</li>
              <li style={{ marginBottom: 8 }}><strong>Erasure:</strong> Request deletion of your personal data ("right to be forgotten").</li>
              <li style={{ marginBottom: 8 }}><strong>Portability:</strong> Receive your data in a machine-readable format.</li>
              <li style={{ marginBottom: 8 }}><strong>Restriction:</strong> Ask us to restrict processing in certain circumstances.</li>
              <li style={{ marginBottom: 8 }}><strong>Objection:</strong> Object to processing based on legitimate interests.</li>
            </ul>
            <p>To exercise any of these rights, email <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#1A3A8F" }}>{CONTACT_EMAIL}</a>. We will respond within 30 days.</p>
            <p>You also have the right to lodge a complaint with your national data protection authority.</p>
          </Section>

          <Section title="8. Cookies">
            <p>We use the following cookies:</p>
            <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
              <li style={{ marginBottom: 8 }}><strong>next-auth.session-token:</strong> Required for authentication. Contains a signed JWT. Expires after 30 days.</li>
              <li style={{ marginBottom: 8 }}><strong>next-auth.csrf-token:</strong> Required for security (CSRF protection).</li>
            </ul>
            <p>We do not use advertising cookies, tracking pixels, or analytics cookies that identify individual users.</p>
          </Section>

          <Section title="9. Security">
            <p>We implement appropriate technical and organisational measures to protect your data, including encryption in transit (TLS), encrypted database connections, and access controls. No system is 100% secure — if you discover a security vulnerability, please disclose it responsibly to {CONTACT_EMAIL}.</p>
          </Section>

          <Section title="10. Changes to this policy">
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes by email or by displaying a notice in the product. Continued use of Regulaton after changes constitutes acceptance of the updated policy.</p>
          </Section>

          <Section title="11. Contact">
            <p>For privacy questions, data subject requests, or to reach our Data Protection contact:</p>
            <p><a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#1A3A8F" }}>{CONTACT_EMAIL}</a></p>
          </Section>

        </div>
      </div>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          <Link href="/" className="nav-link-hover" style={{ color: "var(--text-muted)", textDecoration: "none", marginRight: 16 }}>Regulaton</Link>
          <Link href="/terms" className="nav-link-hover" style={{ color: "var(--text-muted)", textDecoration: "none", marginRight: 16 }}>Terms</Link>
          <Link href="/privacy" className="nav-link-hover" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Privacy</Link>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{
        fontFamily: "IBM Plex Serif, serif", fontSize: 20, fontWeight: 600,
        color: "var(--text-primary)", margin: "0 0 12px", letterSpacing: "-0.01em",
      }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </div>
  );
}
