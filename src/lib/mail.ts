import type { Env } from './types';

export async function sendResetEmail(
  to: string,
  resetUrl: string,
  env: Env
) {
  const apiKey = env.RESEND_API_KEY;
  const from   = env.EMAIL_FROM || 'no-reply@example.com';
  const app    = env.APP_NAME || 'Aplicativo';

  if (!apiKey) {
    throw new Error('RESEND_API_KEY não configurada');
  }

  console.log(">> RESEND_API_KEY carregada:", apiKey?.slice(0, 8));
  console.log(">> EMAIL_FROM usado:", from);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Redefinição de senha - ${app}`,
      html: `
        <p>Você solicitou a redefinição de senha.</p>
        <p>Clique no link abaixo para continuar:</p>
        <a href="${resetUrl}">${resetUrl}</a>
      `,
    }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    console.error('Erro Resend (status):', res.status);
    console.error('Erro Resend (json):', json);
    throw new Error('Falha no envio do e-mail');
  }

  console.log("✅ Email enviado com sucesso:", json);
}
