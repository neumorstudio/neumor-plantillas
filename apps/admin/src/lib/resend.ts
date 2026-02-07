import { Resend } from "resend";

// Inicializar cliente Resend
const resendApiKey = process.env.RESEND_API_KEY;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Configuracion de email base
const EMAIL_DOMAIN = "neumorstudio.com";
const DEFAULT_FROM_NAME = "NeumorStudio";

export const emailConfig = {
  from: process.env.EMAIL_FROM || `${DEFAULT_FROM_NAME} <noreply@${EMAIL_DOMAIN}>`,
  replyTo: process.env.EMAIL_REPLY_TO || `soporte@${EMAIL_DOMAIN}`,
  domain: EMAIL_DOMAIN,
};

// Genera el remitente con el nombre del negocio
export function getFromAddress(businessName?: string): string {
  const name = businessName || DEFAULT_FROM_NAME;
  return `${name} <noreply@${EMAIL_DOMAIN}>`;
}

// Tipos
export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

// Funcion para enviar email
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (!resend) {
    return { success: false, error: "Servicio de email no configurado" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: params.from || emailConfig.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo || emailConfig.replyTo,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// Enviar multiples emails (batch)
export async function sendBatchEmails(
  emails: Array<{
    to: string;
    subject: string;
    html: string;
  }>
): Promise<{ success: number; failed: number; errors: string[] }> {
  if (!resend) {
    return { success: 0, failed: emails.length, errors: ["Resend no configurado"] };
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Resend soporta batch de hasta 100 emails
  const batches = [];
  for (let i = 0; i < emails.length; i += 100) {
    batches.push(emails.slice(i, i + 100));
  }

  for (const batch of batches) {
    try {
      const { data, error } = await resend.batch.send(
        batch.map((email) => ({
          from: emailConfig.from,
          to: email.to,
          subject: email.subject,
          html: email.html,
          replyTo: emailConfig.replyTo,
        }))
      );

      if (error) {
        results.failed += batch.length;
        results.errors.push(error.message);
      } else {
        results.success += data?.data?.length || batch.length;
      }
    } catch (err) {
      results.failed += batch.length;
      results.errors.push(String(err));
    }
  }

  return results;
}
