"use client";
// app/(auth)/login/page.tsx
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

// Inner component — isolates useSearchParams() so the outer page
// can wrap it in Suspense for Next.js static prerendering.
function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();

  const verify      = params.get("verify") === "1";
  const error       = params.get("error");
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  const [email,   setEmail]   = useState("");
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  // Already signed in → redirect
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(session?.hasOrg ? "/dashboard" : "/onboarding");
    }
  }, [status, session, router]);

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    await signIn("email", { email, redirect: false, callbackUrl });
    setSending(false);
    setSent(true);
  }

  if (status === "loading") {
    return (
      <div style={styles.page}>
        <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div className="px-6 py-9 sm:px-9 sm:py-10" style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          Regula<span style={{ color: "#059669" }}>ton</span>
        </div>
        <p style={styles.sub}>
          EU AI Act compliance for SMBs
        </p>

        {/* Magic link sent */}
        {(sent || verify) ? (
          <div style={styles.sentBox}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6, color: "var(--text-primary)" }}>
              Check your inbox
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
              We've sent a sign-in link to <strong>{email || "your email"}</strong>.
              Click the link to continue — expires in 24 hours.
            </p>
          </div>
        ) : (
          <>
            {/* Error banner */}
            {error && (
              <div style={styles.errorBox}>
                {error === "OAuthAccountNotLinked"
                  ? "This email is already linked to a different provider."
                  : "Something went wrong. Please try again."}
              </div>
            )}

            {/* GitHub OAuth */}
            <button
              style={styles.githubBtn}
              className="btn-dark"
              onClick={() => signIn("github", { callbackUrl })}
            >
              <svg height="20" width="20" viewBox="0 0 24 24" fill="var(--btn-primary-text)">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
              Continue with GitHub
            </button>

            <div style={styles.divider}>
              <span style={styles.dividerText}>or</span>
            </div>

            {/* Email magic link */}
            <form onSubmit={handleEmailSignIn}>
              <div style={styles.field}>
                <label style={styles.label}>Work email</label>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                style={styles.emailBtn}
                className={sending ? "" : "btn-green"}
                disabled={sending || !email}
              >
                {sending ? "Sending link…" : "Send sign-in link"}
              </button>
            </form>

            <p style={styles.terms}>
              By signing in you agree to our Terms of Service and Privacy Policy.
              We'll never share your data.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading…</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "var(--bg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: "Inter, sans-serif",
  },
  card: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    width: "100%",
    maxWidth: 380,
  },
  logo: {
    fontFamily: "IBM Plex Serif, Georgia, serif",
    fontSize: 24,
    fontWeight: 600,
    color: "var(--text-primary)",
    textAlign: "center",
    marginBottom: 6,
  },
  sub: {
    fontSize: 14,
    color: "var(--text-secondary)",
    textAlign: "center",
    margin: "0 0 28px",
  },
  githubBtn: {
    width: "100%",
    padding: "11px 16px",
    background: "var(--btn-primary-bg)",
    color: "var(--btn-primary-text)",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    fontFamily: "Inter, sans-serif",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "20px 0",
  },
  dividerText: {
    fontSize: 12,
    color: "var(--text-muted)",
    background: "var(--bg-card)",
    padding: "0 8px",
    flex: 1,
    textAlign: "center",
    position: "relative",
  },
  field:  { marginBottom: 14 },
  label:  { display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 6 },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid var(--border)",
    borderRadius: 7,
    fontSize: 14,
    color: "var(--text-primary)",
    background: "var(--bg-card)",
    caretColor: "var(--text-primary)",
    fontFamily: "Inter, sans-serif",
    outline: "none",
    boxSizing: "border-box",
  },
  emailBtn: {
    width: "100%",
    padding: "11px 16px",
    background: "var(--btn-primary-bg)",
    color: "var(--btn-primary-text)",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "Inter, sans-serif",
  },
  terms:    { fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 16, lineHeight: 1.5 },
  sentBox:  { textAlign: "center", padding: "20px 0" },
  errorBox: {
    background: "var(--danger-bg)",
    border: "1px solid var(--danger-border)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    color: "var(--danger)",
    marginBottom: 16,
  },
};
