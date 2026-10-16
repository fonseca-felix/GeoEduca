const nodemailer = require('nodemailer');

function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user.trim(),
      pass: pass.replace(/\s+/g, '') // Remove espaços caso a Senha de App venha formatada em blocos de 4 letras
    }
  });
}

/**
 * Envia o e-mail de boas-vindas ao professor recém-cadastrado com a senha provisória e o código de 6 dígitos
 */
async function sendProfessorWelcomeEmail({ to, nome, emailLogin, senhaProvisoria, codigoVerificacao }) {
  const transporter = getTransporter();
  const fromEmail = process.env.EMAIL_USER || 'no-reply@geoeduca.com';

  if (!transporter) {
    console.warn(`⚠️ [GeoEduca Email] EMAIL_USER / EMAIL_PASS não configurados no .env. Código para ${to}: ${codigoVerificacao}`);
    return { sent: false, simulated: true, codigoVerificacao };
  }

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
      <div style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 28px 32px; border-bottom: 2px solid #cca43b; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; color: #cca43b; letter-spacing: 0.5px;">🌍 GeoEduca</h1>
        <p style="margin: 6px 0 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Painel do Professor</p>
      </div>
      <div style="padding: 32px;">
        <h2 style="margin-top: 0; color: #f8fafc; font-size: 20px;">Olá, Prof(a). ${nome}!</h2>
        <p style="color: #cbd5e1; line-height: 1.6; font-size: 15px;">
          Sua conta de professor(a) foi cadastrada na plataforma <strong>GeoEduca</strong>. Este endereço de Gmail também está configurado como seu <strong>e-mail oficial de recuperação de senha</strong>.
        </p>

        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 10px; font-size: 13px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Suas Credenciais de Acesso:</p>
          <p style="margin: 6px 0; font-size: 15px; color: #f8fafc;"><strong>Email de Login:</strong> ${emailLogin}</p>
          ${senhaProvisoria ? `<p style="margin: 6px 0; font-size: 15px; color: #f8fafc;"><strong>Senha Provisória:</strong> <code style="background: #0f172a; padding: 3px 8px; border-radius: 6px; color: #cca43b;">${senhaProvisoria}</code></p>` : ''}
        </div>

        <div style="background: rgba(204, 164, 59, 0.12); border: 1px solid rgba(204, 164, 59, 0.4); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #cbd5e1;">Código de Confirmação para o 1º Login:</p>
          <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #cca43b; font-family: monospace;">${codigoVerificacao}</div>
          <p style="margin: 10px 0 0; font-size: 12px; color: #94a3b8;">Digite este código quando solicitado no seu primeiro acesso à plataforma.</p>
        </div>

        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
          Caso precise trocar sua senha futuramente, basta clicar em <strong>"Esqueci minha senha"</strong> na tela de login do GeoEduca para receber um código neste mesmo Gmail.
        </p>
      </div>
      <div style="background: #090d16; padding: 16px 32px; text-align: center; font-size: 12px; color: #64748b;">
        GeoEduca — Plataforma Educacional de Geografia
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"GeoEduca" <${fromEmail}>`,
    to,
    subject: '🌍 Bem-vindo(a) ao GeoEduca — Código de Confirmação e Acesso',
    html
  });

  return { sent: true };
}

/**
 * Envia o código de 6 dígitos para recuperação de senha ("Esqueci minha senha")
 */
async function sendPasswordResetCodeEmail({ to, nome, codigoRecuperacao }) {
  const transporter = getTransporter();
  const fromEmail = process.env.EMAIL_USER || 'no-reply@geoeduca.com';

  if (!transporter) {
    console.warn(`⚠️ [GeoEduca Email] EMAIL_USER / EMAIL_PASS não configurados no .env. Código de recuperação para ${to}: ${codigoRecuperacao}`);
    return { sent: false, simulated: true, codigoRecuperacao };
  }

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
      <div style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 28px 32px; border-bottom: 2px solid #cca43b; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; color: #cca43b; letter-spacing: 0.5px;">🌍 GeoEduca</h1>
        <p style="margin: 6px 0 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Recuperação de Senha</p>
      </div>
      <div style="padding: 32px;">
        <h2 style="margin-top: 0; color: #f8fafc; font-size: 20px;">Olá, Prof(a). ${nome || ''}!</h2>
        <p style="color: #cbd5e1; line-height: 1.6; font-size: 15px;">
          Recebemos uma solicitação para redefinir a senha da sua conta no <strong>GeoEduca</strong>. Utilize o código de 6 dígitos abaixo na tela de login para criar sua nova senha:
        </p>

        <div style="background: rgba(204, 164, 59, 0.12); border: 1px solid rgba(204, 164, 59, 0.4); border-radius: 12px; padding: 22px; text-align: center; margin: 24px 0;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #cbd5e1;">Seu Código de Recuperação:</p>
          <div style="font-size: 34px; font-weight: 700; letter-spacing: 8px; color: #cca43b; font-family: monospace;">${codigoRecuperacao}</div>
          <p style="margin: 10px 0 0; font-size: 12px; color: #94a3b8;">Válido por 15 minutos.</p>
        </div>

        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
          Se você não solicitou a troca de senha, ignore este e-mail com segurança. Sua senha atual permanecerá a mesma.
        </p>
      </div>
      <div style="background: #090d16; padding: 16px 32px; text-align: center; font-size: 12px; color: #64748b;">
        GeoEduca — Plataforma Educacional de Geografia
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"GeoEduca" <${fromEmail}>`,
    to,
    subject: '🔐 Código de Recuperação de Senha — GeoEduca',
    html
  });

  return { sent: true };
}

module.exports = {
  sendProfessorWelcomeEmail,
  sendPasswordResetCodeEmail
};
