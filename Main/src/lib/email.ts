export type SendEmailOpts = {
  to: string | string[];
  subject: string;
  html: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string | string[];
};

export async function sendEmail(opts: SendEmailOpts) {
  const { RESEND_API_KEY, EMAIL_FROM } = process.env;
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY belum diset di .env");
  if (!EMAIL_FROM) throw new Error("EMAIL_FROM belum diset di .env");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      cc: opts.cc,
      bcc: opts.bcc,
      reply_to: opts.replyTo,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend ${res.status}: ${text}`);
  }
  return res.json(); // { id: "...", ... }
}
