type SendAuthEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type MailResult = {
  delivered: boolean;
};

export async function sendAuthEmail(input: SendAuthEmailInput): Promise<MailResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_FROM_EMAIL;

  if (!resendApiKey || !from) {
    throw new Error("EMAIL_PROVIDER_NOT_CONFIGURED");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`EMAIL_SEND_FAILED:${response.status}:${body}`);
  }

  return { delivered: true };
}
