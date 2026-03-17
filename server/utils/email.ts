import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const config = useRuntimeConfig();
    const key =
      (config.resendApiKey as string) ||
      process.env.RESEND_API_KEY ||
      process.env.NUXT_RESEND_API_KEY;
    if (!key) {
      throw new Error(
        "RESEND_API_KEY or NUXT_RESEND_API_KEY is not configured",
      );
    }
    resendClient = new Resend(key);
  }
  return resendClient;
}

const DEFAULT_FROM =
  "Μάθε Παιδί Μου Αρχαία <onboarding@resend.dev>";

export async function sendVerificationEmail(to: string, link: string): Promise<void> {
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: DEFAULT_FROM,
    to,
    subject: "Verify your email - Mathe Paidi Mou Arxaia",
    html: `
      <p>Click the link below to verify your email:</p>
      <p><a href="${link}">${link}</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  });
  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error("Failed to send verification email");
}

export async function sendPasswordResetEmail(to: string, link: string): Promise<void> {
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: DEFAULT_FROM,
    to,
    subject: "Reset your password - Mathe Paidi Mou Arxaia",
    html: `
      <p>Click the link below to reset your password:</p>
      <p><a href="${link}">${link}</a></p>
      <p>This link expires in 1 hour.</p>
    `,
  });
  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error("Failed to send password reset email");
}

export async function sendContactEmail(params: {
  to: string;
  replyTo: string;
  subject: string;
  html: string;
}): Promise<void> {
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: DEFAULT_FROM,
    to: params.to,
    replyTo: params.replyTo,
    subject: params.subject,
    html: params.html,
  });
  if (error) {
    throw new Error(error.message);
  }
  if (!data?.id) {
    throw new Error("Failed to send email");
  }
}
