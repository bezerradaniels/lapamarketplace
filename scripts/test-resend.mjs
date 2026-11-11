import fs from "node:fs";
import path from "node:path";
import { Resend } from "resend";

// Carregar variáveis de .env.local manualmente para teste em script puro
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnv();

const apiKey = process.env.RESEND_API_KEY;
const toEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "daniel.ddsb@gmail.com";
const fromEmail =
  process.env.RESEND_FROM_EMAIL ||
  "Lapa Marketplace <naoresponda@lapamarketplace.com.br>";

console.log("==================================================");
console.log("🔍 Teste de Envio de E-mail via Resend (Lapa Marketplace)");
console.log("==================================================");
console.log(`- Destinatário: ${toEmail}`);
console.log(`- Remetente:    ${fromEmail}`);
console.log(
  `- API Key:      ${
    apiKey ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` : "❌ NÃO CONFIGURADA"
  }`
);
console.log("--------------------------------------------------");

if (!apiKey) {
  console.error("❌ ERRO: RESEND_API_KEY não foi encontrada no arquivo .env.local.");
  console.log("👉 Adicione sua chave do Resend no .env.local:");
  console.log("   RESEND_API_KEY=re_suachaveaqui\n");
  process.exit(1);
}

const resend = new Resend(apiKey);

async function testSend() {
  try {
    console.log("🚀 Enviando e-mail de teste...");
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: "🧪 Teste de Integração Resend - Lapa Marketplace",
      html: `
        <div style="font-family: sans-serif; padding: 24px; color: #1e293b;">
          <h2 style="color: #059669;">🎉 Resend configurado com sucesso!</h2>
          <p>Este é um e-mail de teste disparado pelo script do <strong>Lapa Marketplace</strong>.</p>
          <ul>
            <li><strong>Destinatário:</strong> ${toEmail}</li>
            <li><strong>Remetente:</strong> ${fromEmail}</li>
            <li><strong>Status:</strong> Operacional e pronto para notificações de cadastro.</li>
          </ul>
        </div>
      `,
      text: `Resend configurado com sucesso para ${toEmail} a partir de ${fromEmail}!`,
    });

    if (error) {
      console.error("\n❌ Falha retornada pela API do Resend:");
      console.error(error);
      if (
        error.message?.includes("domain") ||
        error.message?.includes("verify") ||
        error.message?.includes("from")
      ) {
        console.log("\n💡 Dica sobre o domínio lapamarketplace.com.br:");
        console.log(
          "Para enviar a partir de 'naoresponda@lapamarketplace.com.br', o domínio deve estar verificado no painel do Resend (https://resend.com/domains)."
        );
        console.log(
          "Caso ainda não tenha configurado os registros DNS no seu provedor de domínio, você pode testar temporariamente alterando RESEND_FROM_EMAIL='onboarding@resend.dev' no seu .env.local."
        );
      }
      process.exit(1);
    }

    console.log("\n✅ E-mail enviado com sucesso!");
    console.log(`📬 ID do E-mail: ${data?.id}`);
    console.log(`👉 Verifique a caixa de entrada de ${toEmail}`);
  } catch (err) {
    console.error("\n❌ Exceção ao tentar enviar:", err);
    process.exit(1);
  }
}

testSend();

