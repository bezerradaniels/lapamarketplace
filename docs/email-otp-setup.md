# Configuração de Email com OTP (Código de Confirmação)

## Visão Geral

O sistema agora usa **OTP (One-Time Password)** em vez de links de confirmação por email. O usuário recebe um código de 6 dígitos no email e deve inseri-lo na aplicação para confirmar a conta.

## Fluxo de Autenticação

1. Usuário preenche formulário de signup (nome, email, senha)
2. Sistema envia email com código de 6 dígitos via Supabase Auth
3. Usuário é redirecionado para página de confirmação
4. Usuário insere o código recebido
5. Sistema valida o código e cria a sessão
6. Usuário é redirecionado para onboarding (/nova-loja)

## Configuração no Supabase

### 1. Configurar Template de Email

No dashboard do Supabase:

1. Vá em **Authentication** → **Email Templates**
2. Selecione o template **"Confirm signup"**
3. Configure o template com o seguinte conteúdo:

**Assunto:**
```
Seu código de confirmação - Zapable
```

**Corpo do Email (HTML):**
```html
<h2>Confirme sua conta</h2>
<p>Olá {{ .Data.name }},</p>
<p>Use o código abaixo para confirmar sua conta no Zapable:</p>
<div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">{{ .Token }}</span>
</div>
<p>Este código expira em 1 hora.</p>
<p>Se você não solicitou esta conta, ignore este email.</p>
<p style="font-size: 12px; color: #666;">Equipe Zapable</p>
```

### 2. Verificar Configuração SMTP

Como você já tem o Resend configurado, verifique:

1. Vá em **Project Settings** → **Authentication** → **SMTP Settings**
2. Confirme as configurações:
   - **Host:** `smtp.resend.com`
   - **Port:** `587`
   - **Username:** `resend`
   - **Password:** Sua API key do Resend
   - **Sender Email:** Seu domínio configurado no Resend (ex: `noreply@zapable.com.br`)
3. Teste o envio clicando em "Test SMTP Settings"

### 3. Habilitar Confirmação de Email

1. Vá em **Authentication** → **Providers** → **Email**
2. Confirme que **"Confirm email"** está habilitado
3. O Supabase usará automaticamente o template configurado

## Variáveis Disponíveis no Template

O Supabase disponibiliza estas variáveis no template:

- `{{ .Token }}` - O código OTP de 6 dígitos
- `{{ .Email }}` - Email do usuário
- `{{ .Data.name }}` - Nome do usuário (passado via `options.data`)
- `{{ .SiteURL }}` - URL do site
- `{{ .RedirectURL }}` - URL de redirecionamento configurada

## Testes

### Teste Local

1. Inicie o projeto: `npm run dev`
2. Acesse `/cadastrar`
3. Preencha o formulário com um email real
4. Verifique o email recebido
5. Insira o código na página de confirmação
6. Confirme que é redirecionado para `/nova-loja`

### Teste de Reenvio

1. Após receber o código, clique em "Reenviar código"
2. Verifique que um novo código é enviado
3. O código anterior deve continuar funcionando até expirar

## Solução de Problemas

### Email não chega

- Verifique a pasta de spam/lixo eletrônico
- Confirme as credenciais SMTP no Supabase
- Verifique os logs do Supabase (Project Settings → Logs)
- Teste o SMTP no dashboard do Resend

### Código inválido

- Verifique se o usuário está inserindo exatamente 6 dígitos
- O código expira em 1 hora por padrão do Supabase
- Cada novo código invalida o anterior

### Erro 500 ao enviar

- Verifique se o template está configurado corretamente
- Confirme que as variáveis no template são válidas
- Verifique os logs do Supabase para erro específico

## Personalização

### Alterar duração do código

No dashboard do Supabase:
- Authentication → Settings
- Altere "Email confirmation token expiry" (padrão: 1 hora)

### Alterar tamanho do código

O Supabase usa 6 dígitos por padrão. Para alterar, seria necessário usar edge functions customizadas (não recomendado para MVP).

### Personalizar design do email

Edite o template HTML no dashboard do Supabase conforme sua identidade visual.
