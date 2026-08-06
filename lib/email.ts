// lib/email.ts
// Transactional email via Resend.

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.EMAIL_FROM ?? "Regulaton <hello@regulaton.com>";
const APP    = process.env.NEXT_PUBLIC_APP_URL ?? "https://regulaton.com";

export async function sendWelcomeEmail(to: string, name?: string | null) {
  if (!process.env.RESEND_API_KEY) return; // skip if not configured

  const firstName = name?.split(" ")[0] ?? "there";

  await resend.emails.send({
    from:    FROM,
    to,
    subject: "Welcome to Regulaton — let's get you compliant",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F8FB;font-family:Inter,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:14px;border:1px solid #E2E8F0;overflow:hidden;">

    <!-- Header -->
    <div style="background:#1A2332;padding:28px 36px;">
      <div style="font-family:Georgia,serif;font-size:22px;font-weight:600;color:white;">
        Regula<span style="color:#059669;">ton</span>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:36px;">
      <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:600;color:#1A2332;margin:0 0 16px;letter-spacing:-0.02em;">
        Hi ${firstName} 👋
      </h1>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        Welcome to Regulaton. You're one step closer to EU AI Act compliance.
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px;">
        Here's what to do next:
      </p>

      <!-- Steps -->
      <div style="background:#F7F8FB;border-radius:10px;padding:20px;margin-bottom:28px;">
        ${[
          ["1", "Complete your onboarding", "Tell us which AI tools your organisation uses — takes about 15 minutes."],
          ["2", "Review your documents", "We'll generate your Acceptable Use Policy and AI System Register automatically."],
          ["3", "Finalise and download", "Finalise each document and download the .docx files for your records."],
        ].map(([n, title, desc]) => `
          <div style="display:flex;gap:14px;margin-bottom:16px;">
            <div style="width:26px;height:26px;border-radius:50%;background:#1A2332;color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex-shrink:0;line-height:26px;text-align:center;">${n}</div>
            <div>
              <div style="font-size:14px;font-weight:600;color:#1A2332;margin-bottom:2px;">${title}</div>
              <div style="font-size:13px;color:#6B7280;">${desc}</div>
            </div>
          </div>
        `).join("")}
      </div>

      <a href="${APP}/dashboard" style="display:inline-block;padding:12px 28px;background:#059669;color:white;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
        Go to dashboard →
      </a>

      <p style="font-size:13px;color:#9CA3AF;margin:28px 0 0;line-height:1.6;">
        Your 14-day free trial gives you full access to all features. No credit card required yet.
        Questions? Reply to this email — we read every one.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:20px 36px;border-top:1px solid #E2E8F0;display:flex;justify-content:space-between;align-items:center;">
      <div style="font-size:12px;color:#9CA3AF;">© 2026 Regulaton</div>
      <div style="font-size:12px;">
        <a href="${APP}/privacy" style="color:#9CA3AF;text-decoration:none;margin-right:14px;">Privacy</a>
        <a href="${APP}/terms" style="color:#9CA3AF;text-decoration:none;">Terms</a>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim(),
  });
}

export async function sendTrialExpiryWarning(to: string, name?: string | null, daysLeft = 3) {
  if (!process.env.RESEND_API_KEY) return;

  const firstName = name?.split(" ")[0] ?? "there";

  await resend.emails.send({
    from:    FROM,
    to,
    subject: `Your Regulaton trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:40px 24px;background:#F7F8FB;font-family:Inter,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:14px;border:1px solid #E2E8F0;padding:36px;">
    <div style="font-family:Georgia,serif;font-size:20px;font-weight:600;color:#1A2332;margin-bottom:24px;">
      Regula<span style="color:#059669;">ton</span>
    </div>
    <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:600;color:#1A2332;margin:0 0 16px;">
      Your trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}, ${firstName}
    </h1>
    <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px;">
      Subscribe now to keep access to your compliance documents, AI tool inventory, and compliance score.
    </p>
    <a href="${APP}/settings" style="display:inline-block;padding:12px 28px;background:#1A2332;color:white;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
      Subscribe now →
    </a>
    <p style="font-size:13px;color:#9CA3AF;margin:24px 0 0;">
      Plans start at €29/month. Cancel anytime.
    </p>
  </div>
</body>
</html>
    `.trim(),
  });
}
