import { Resend } from "resend";

/**
 * Configuração e inicialização do Resend para envio de e-mails transacionais
 * no Lapa Marketplace.
 */

export const DEFAULT_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  "Lapa Marketplace <naoresponda@lapamarketplace.com.br>";

export const ADMIN_NOTIFICATION_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL || "daniel.ddsb@gmail.com";

/**
 * Retorna uma instância do Resend se a chave de API estiver definida no ambiente.
 */
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }
  return new Resend(apiKey.trim());
}

export interface NewUserSignupNotificationParams {
  userId?: string | null;
  fullName?: string | null;
  email: string;
  accountType?: "customer" | "merchant" | string | null;
  method?: "email_password" | "google_oauth" | "oauth" | string;
  registeredAt?: Date;
}

export interface NewStoreNotificationParams {
  storeName: string;
  slug: string;
  ownerEmail?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  neighborhoodName?: string | null;
  createdAt?: Date;
}

function formatBrazilianDate(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "full",
      timeStyle: "medium",
      timeZone: "America/Bahia",
    }).format(date);
  } catch {
    return date.toLocaleString("pt-BR");
  }
}

function getAccountTypeBadge(accountType?: string | null): {
  label: string;
  bgColor: string;
  textColor: string;
} {
  if (accountType === "merchant") {
    return {
      label: "🏪 Lojista / Vendedor",
      bgColor: "#ecfdf5",
      textColor: "#047857",
    };
  }
  return {
    label: "🛍️ Cliente / Morador",
    bgColor: "#f1f5f9",
    textColor: "#334155",
  };
}

function getMethodLabel(method?: string): string {
  switch (method) {
    case "email_password":
      return "E-mail e Senha";
    case "google_oauth":
      return "Google OAuth (1 clique)";
    case "oauth":
      return "OAuth Social";
    default:
      return method || "Formulário Web";
  }
}

/**
 * Gera o template HTML do e-mail de notificação de novo cadastro.
 */
function buildSignupEmailHtml(
  params: NewUserSignupNotificationParams,
  siteUrl: string
): string {
  const formattedDate = formatBrazilianDate(params.registeredAt);
  const badge = getAccountTypeBadge(params.accountType);
  const methodLabel = getMethodLabel(params.method);
  const displayName = params.fullName?.trim() || "Não informado";
  const userEmail = params.email.trim();
  const userId = params.userId || "Gerado no Supabase";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Novo Cadastro no Lapa Marketplace</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Top Header com Branding -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 32px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #34d399; margin-bottom: 6px;">
                      Lapa Marketplace &bull; Bom Jesus da Lapa
                    </div>
                    <div style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                      🎉 Novo Cadastro Realizado
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Mensagem Principal -->
          <tr>
            <td style="padding: 32px 32px 20px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                Olá, <strong>Daniel</strong>!
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #64748b;">
                Um novo usuário acabou de se cadastrar no ecossistema do <strong>Lapa Marketplace</strong>. Confira os detalhes abaixo:
              </p>

              <!-- Card de Informações do Usuário -->
              <table role="presentation" width="100%" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; border-collapse: separate; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td style="padding-bottom: 12px; width: 38%; font-size: 13px; font-weight: 600; color: #64748b;">
                    👤 Nome Completo:
                  </td>
                  <td style="padding-bottom: 12px; font-size: 14px; font-weight: 700; color: #0f172a;">
                    ${displayName}
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px; font-size: 13px; font-weight: 600; color: #64748b;">
                    📧 E-mail:
                  </td>
                  <td style="padding-bottom: 12px; font-size: 14px; font-weight: 700; color: #0284c7;">
                    <a href="mailto:${userEmail}" style="color: #0284c7; text-decoration: none;">${userEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px; font-size: 13px; font-weight: 600; color: #64748b;">
                    🏷️ Tipo de Conta:
                  </td>
                  <td style="padding-bottom: 12px;">
                    <span style="display: inline-block; background-color: ${badge.bgColor}; color: ${badge.textColor}; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">
                      ${badge.label}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px; font-size: 13px; font-weight: 600; color: #64748b;">
                    🔑 Método de Cadastro:
                  </td>
                  <td style="padding-bottom: 12px; font-size: 13px; font-weight: 600; color: #334155;">
                    ${methodLabel}
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px; font-size: 13px; font-weight: 600; color: #64748b;">
                    📅 Data e Horário:
                  </td>
                  <td style="padding-bottom: 12px; font-size: 13px; color: #475569;">
                    ${formattedDate}
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 13px; font-weight: 600; color: #64748b;">
                    🆔 ID no Supabase:
                  </td>
                  <td style="font-size: 12px; color: #64748b; font-family: monospace;">
                    ${userId}
                  </td>
                </tr>
              </table>

              <!-- Botão de Ação -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 16px;">
                <tr>
                  <td align="center">
                    <a href="${siteUrl}" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 10px; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);">
                      Acessar Lapa Marketplace &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Rodapé do E-mail -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #94a3b8;">
                Notificação automática gerada pelo sistema do <strong>Lapa Marketplace</strong>.<br>
                Enviado para: <span style="color: #64748b;">${ADMIN_NOTIFICATION_EMAIL}</span> &bull; Remetente: <span style="color: #64748b;">${DEFAULT_FROM_EMAIL}</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Gera a versão em texto puro do e-mail para máxima compatibilidade e deliverability.
 */
function buildSignupEmailText(
  params: NewUserSignupNotificationParams,
  siteUrl: string
): string {
  const formattedDate = formatBrazilianDate(params.registeredAt);
  const badge = getAccountTypeBadge(params.accountType);
  const methodLabel = getMethodLabel(params.method);
  const displayName = params.fullName?.trim() || "Não informado";

  return `🎉 NOVO CADASTRO NO LAPA MARKETPLACE

Olá, Daniel!

Um novo usuário acabou de se cadastrar no Lapa Marketplace:

- Nome: ${displayName}
- E-mail: ${params.email}
- Perfil: ${badge.label}
- Método: ${methodLabel}
- Data/Hora: ${formattedDate}
- ID Supabase: ${params.userId || "N/A"}

Acesse o marketplace em: ${siteUrl}

---
Notificação automática de lapamarketplace.com.br
Remetente: ${DEFAULT_FROM_EMAIL}`;
}

/**
 * Envia notificação por e-mail para daniel.ddsb@gmail.com sempre que alguém se cadastrar.
 * É à prova de falhas: nunca interrompe o fluxo de cadastro do usuário caso o Resend
 * não esteja configurado ou haja instabilidade de rede.
 */
export async function notifyAdminNewUserSignup(
  params: NewUserSignupNotificationParams
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const client = getResendClient();
    const toEmail = ADMIN_NOTIFICATION_EMAIL;
    const fromEmail = DEFAULT_FROM_EMAIL;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lapamarketplace.com.br";

    if (!client) {
      console.warn(
        `[Resend] RESEND_API_KEY não configurada no ambiente. E-mail de cadastro de "${params.email}" para "${toEmail}" não foi enviado.`
      );
      return {
        success: false,
        error: "RESEND_API_KEY não configurada",
      };
    }

    const isMerchant = params.accountType === "merchant";
    const accountLabel = isMerchant ? "Lojista" : "Cliente";
    const userIdentifier = params.fullName?.trim() || params.email;

    const subject = `🎉 Novo cadastro no Lapa Marketplace: ${userIdentifier} (${accountLabel})`;
    const html = buildSignupEmailHtml(params, siteUrl);
    const text = buildSignupEmailText(params, siteUrl);

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: toEmail,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("[Resend] Erro retornado pela API do Resend:", error);
      return { success: false, error: error.message };
    }

    console.log(
      `[Resend] Notificação de novo cadastro enviada com sucesso para ${toEmail}. ID: ${data?.id}`
    );
    return { success: true, id: data?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Resend] Exceção ao enviar notificação de cadastro:", message);
    return { success: false, error: message };
  }
}

/**
 * Notifica o administrador quando uma nova loja é cadastrada no onboarding.
 */
export async function notifyAdminNewStoreCreated(
  params: NewStoreNotificationParams
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const client = getResendClient();
    const toEmail = ADMIN_NOTIFICATION_EMAIL;
    const fromEmail = DEFAULT_FROM_EMAIL;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lapamarketplace.com.br";

    if (!client) {
      console.warn(
        `[Resend] RESEND_API_KEY não configurada. Notificação da loja "${params.storeName}" não enviada.`
      );
      return { success: false, error: "RESEND_API_KEY não configurada" };
    }

    const storeUrl = `${siteUrl}/${params.slug}`;
    const subject = `🏪 Nova Loja Criada no Lapa Marketplace: ${params.storeName}`;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<body style="font-family: sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px;">
    <h2 style="color: #059669; margin-top: 0;">🏪 Nova Loja Cadastrada!</h2>
    <p>Uma nova loja acabou de concluir o onboarding no <strong>Lapa Marketplace</strong>:</p>
    <ul>
      <li><strong>Nome da Loja:</strong> ${params.storeName}</li>
      <li><strong>Slug:</strong> ${params.slug}</li>
      <li><strong>WhatsApp:</strong> ${params.whatsapp || "Não informado"}</li>
      <li><strong>Bairro / Endereço:</strong> ${params.neighborhoodName || ""} - ${params.address || ""}</li>
      <li><strong>E-mail do Proprietário:</strong> ${params.ownerEmail || "N/A"}</li>
    </ul>
    <p><a href="${storeUrl}" style="display: inline-block; background: #059669; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px;">Ver Loja &rarr;</a></p>
  </div>
</body>
</html>`;

    const text = `NOVA LOJA CRIADA NO LAPA MARKETPLACE

Nome: ${params.storeName}
Slug: ${params.slug}
WhatsApp: ${params.whatsapp || "N/A"}
Endereço: ${params.neighborhoodName || ""} - ${params.address || ""}
E-mail: ${params.ownerEmail || "N/A"}
Link: ${storeUrl}
`;

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: toEmail,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("[Resend] Erro ao enviar notificação de loja:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Resend] Exceção ao notificar criação de loja:", message);
    return { success: false, error: message };
  }
}

