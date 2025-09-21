// src/lib/mail.ts
export type MailEnv = {
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  APP_NAME?: string;
};

export async function sendResetEmail(env: MailEnv, to: string, resetUrl: string) {
  const app = env.APP_NAME ?? 'Aplicativo';
  const html = `
    <p>Olá,</p>
    <p>Recebemos uma solicitação para redefinir a sua senha no <b>${app}</b>.</p>
    <p><a href="${resetUrl}">${resetUrl}</a> (válido por 1 hora)</p>
    <p>Se você não solicitou, ignore este e-mail.</p>
  `;

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM, // domínio verificado no Resend
      to,
      subject: `Redefinição de senha — ${app}`,
      html,
    }),
  });

  if (!resp.ok) throw new Error(`Falha ao enviar e-mail: ${await resp.text()}`);
}
