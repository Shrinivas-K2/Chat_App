const { EMAIL_FROM, RESEND_API_KEY } = require("../../config/env");

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendEmailVerificationEmail({ to, username, verificationUrl }) {
  if (!RESEND_API_KEY || !EMAIL_FROM) {
    console.warn(`[email:verification] Missing RESEND_API_KEY or EMAIL_FROM. Link for ${to}: ${verificationUrl}`);
    return { queued: false, provider: "console" };
  }

  const safeName = escapeHtml(username || to);
  const safeUrl = escapeHtml(verificationUrl);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [to],
      subject: "Verify your email for Chat App",
      html: `
        <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.55;color:#0f172a;max-width:560px;">
          <h2 style="margin:0 0 12px;">Verify your email</h2>
          <p style="margin:0 0 12px;">Hi ${safeName},</p>
          <p style="margin:0 0 16px;">Please confirm your email to activate your Chat App account.</p>
          <p style="margin:0 0 20px;">
            <a href="${safeUrl}" style="display:inline-block;padding:10px 18px;border-radius:8px;background:#0f766e;color:#fff;text-decoration:none;font-weight:600;">
              Verify Email
            </a>
          </p>
          <p style="margin:0 0 8px;font-size:13px;color:#475569;">
            If the button does not work, open this link:
          </p>
          <p style="margin:0 0 6px;word-break:break-all;font-size:13px;color:#0f766e;">${safeUrl}</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    const error = new Error("Unable to send verification email right now");
    error.status = 502;
    error.details = details;
    throw error;
  }

  return { queued: true, provider: "resend" };
}

module.exports = { sendEmailVerificationEmail };
