// Sends email notification to admin when trial ends or subscription is created/updated
import { adminClient } from '../_shared/auth.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'daniel.ddsb@gmail.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://lapamarketplace.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface BillingNotificationRequest {
  type: 'trial_ended' | 'subscription_created' | 'subscription_updated' | 'subscription_canceled'
  storeId: string
  storeName?: string
  ownerEmail?: string
  ownerName?: string
  planId?: string
  status?: string
}

async function sendEmail(subject: string, htmlContent: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Lapa Marketplace <noreply@lapamarketplace.com.br>',
      to: [ADMIN_EMAIL],
      subject,
      html: htmlContent,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    console.error('Resend API error:', error)
    throw new Error('email_send_failed')
  }
}

function getTrialEndedEmail(data: BillingNotificationRequest): { subject: string; html: string } {
  const safeStoreName = escapeHtml(data.storeName || 'Loja sem nome')
  const safeOwnerEmail = escapeHtml(data.ownerEmail || 'N/A')
  const safeOwnerName = escapeHtml(data.ownerName || 'N/A')

  return {
    subject: '⚠️ Trial finalizado - Lapa Marketplace',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 4px solid #f59e0b;">
          <h2 style="color: #111827; margin-top: 0; font-size: 24px;">⚠️ Trial finalizado</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">O período de trial de uma loja acabou de finalizar.</p>
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px;"><strong>Nome da loja:</strong> ${safeStoreName}</p>
            <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px;"><strong>Nome do proprietário:</strong> ${safeOwnerName}</p>
            <p style="margin: 0; color: #374151; font-size: 15px;"><strong>E-mail:</strong> ${safeOwnerEmail}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
            Este é um e-mail automático do sistema Lapa Marketplace. Não responda.
          </p>
        </div>
      </div>
    `,
  }
}

function getSubscriptionCreatedEmail(data: BillingNotificationRequest): { subject: string; html: string } {
  const safeStoreName = escapeHtml(data.storeName || 'Loja sem nome')
  const safeOwnerEmail = escapeHtml(data.ownerEmail || 'N/A')
  const safeOwnerName = escapeHtml(data.ownerName || 'N/A')
  const safePlanId = escapeHtml(data.planId || 'N/A')

  return {
    subject: '🎉 Nova assinatura - Lapa Marketplace',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 4px solid #10b981;">
          <h2 style="color: #111827; margin-top: 0; font-size: 24px;">🎉 Nova assinatura!</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Uma nova assinatura foi criada na plataforma.</p>
          <div style="background-color: #d1fae5; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #10b981;">
            <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px;"><strong>Nome da loja:</strong> ${safeStoreName}</p>
            <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px;"><strong>Nome do proprietário:</strong> ${safeOwnerName}</p>
            <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px;"><strong>E-mail:</strong> ${safeOwnerEmail}</p>
            <p style="margin: 0; color: #374151; font-size: 15px;"><strong>Plano:</strong> ${safePlanId}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
            Este é um e-mail automático do sistema Lapa Marketplace. Não responda.
          </p>
        </div>
      </div>
    `,
  }
}

function getSubscriptionUpdatedEmail(data: BillingNotificationRequest): { subject: string; html: string } {
  const safeStoreName = escapeHtml(data.storeName || 'Loja sem nome')
  const safeOwnerEmail = escapeHtml(data.ownerEmail || 'N/A')
  const safeOwnerName = escapeHtml(data.ownerName || 'N/A')
  const safePlanId = escapeHtml(data.planId || 'N/A')
  const safeStatus = escapeHtml(data.status || 'N/A')

  return {
    subject: '📝 Assinatura atualizada - Lapa Marketplace',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 4px solid #3b82f6;">
          <h2 style="color: #111827; margin-top: 0; font-size: 24px;">📝 Assinatura atualizada</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Uma assinatura foi atualizada na plataforma.</p>
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #3b82f6;">
            <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px;"><strong>Nome da loja:</strong> ${safeStoreName}</p>
            <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px;"><strong>Nome do proprietário:</strong> ${safeOwnerName}</p>
            <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px;"><strong>E-mail:</strong> ${safeOwnerEmail}</p>
            <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px;"><strong>Plano:</strong> ${safePlanId}</p>
            <p style="margin: 0; color: #374151; font-size: 15px;"><strong>Status:</strong> ${safeStatus}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
            Este é um e-mail automático do sistema Lapa Marketplace. Não responda.
          </p>
        </div>
      </div>
    `,
  }
}

function getSubscriptionCanceledEmail(data: BillingNotificationRequest): { subject: string; html: string } {
  const safeStoreName = escapeHtml(data.storeName || 'Loja sem nome')
  const safeOwnerEmail = escapeHtml(data.ownerEmail || 'N/A')
  const safeOwnerName = escapeHtml(data.ownerName || 'N/A')
  const safePlanId = escapeHtml(data.planId || 'N/A')

  return {
    subject: '❌ Assinatura cancelada - Lapa Marketplace',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 4px solid #ef4444;">
          <h2 style="color: #111827; margin-top: 0; font-size: 24px;">❌ Assinatura cancelada</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Uma assinatura foi cancelada na plataforma.</p>
          <div style="background-color: #fee2e2; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px;"><strong>Nome da loja:</strong> ${safeStoreName}</p>
            <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px;"><strong>Nome do proprietário:</strong> ${safeOwnerName}</p>
            <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px;"><strong>E-mail:</strong> ${safeOwnerEmail}</p>
            <p style="margin: 0; color: #374151; font-size: 15px;"><strong>Plano:</strong> ${safePlanId}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
            Este é um e-mail automático do sistema Lapa Marketplace. Não responda.
          </p>
        </div>
      </div>
    `,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('method_not_allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const data: BillingNotificationRequest = await req.json()

    if (!data.type || !data.storeId) {
      return new Response('missing_fields', { status: 400, headers: corsHeaders })
    }

    // Fetch store and owner details. Owner email/name live on `profiles`,
    // joined to `stores` via owner_id.
    const admin = adminClient()
    const { data: storeData } = await admin
      .from('stores')
      .select('name, owner:profiles!stores_owner_id_fkey ( email, name )')
      .eq('id', data.storeId)
      .single()

    if (storeData) {
      const owner = (storeData as { owner?: { email?: string; name?: string } }).owner
      data.storeName = storeData.name
      data.ownerEmail = owner?.email
      data.ownerName = owner?.name ?? undefined
    }

    let emailContent: { subject: string; html: string }

    switch (data.type) {
      case 'trial_ended':
        emailContent = getTrialEndedEmail(data)
        break
      case 'subscription_created':
        emailContent = getSubscriptionCreatedEmail(data)
        break
      case 'subscription_updated':
        emailContent = getSubscriptionUpdatedEmail(data)
        break
      case 'subscription_canceled':
        emailContent = getSubscriptionCanceledEmail(data)
        break
      default:
        return new Response('invalid_type', { status: 400, headers: corsHeaders })
    }

    await sendEmail(emailContent.subject, emailContent.html)

    return new Response('ok', { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error('billing notification error:', err)
    return new Response('internal_error', { status: 500, headers: corsHeaders })
  }
})
