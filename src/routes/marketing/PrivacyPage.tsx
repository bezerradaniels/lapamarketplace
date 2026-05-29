import { MarketingFooter } from './_shared/MarketingFooter'
import { MarketingNavbar } from './_shared/MarketingNavbar'

const sections = [
  {
    title: '1. Dados que coletamos',
    body: 'Podemos coletar dados de cadastro, contato, acesso, uso da plataforma, informacoes de lojas, produtos, pedidos e dados necessarios para suporte, seguranca e cobranca.',
  },
  {
    title: '2. Como usamos os dados',
    body: 'Usamos os dados para operar a plataforma, autenticar usuarios, processar funcionalidades contratadas, melhorar a experiencia, prestar suporte, prevenir abusos e cumprir obrigacoes legais.',
  },
  {
    title: '3. Compartilhamento',
    body: 'Podemos compartilhar dados com fornecedores essenciais para hospedagem, pagamentos, comunicacao, analytics, seguranca e atendimento, sempre conforme a finalidade da plataforma.',
  },
  {
    title: '4. Cookies e tecnologias semelhantes',
    body: 'Utilizamos cookies e tecnologias semelhantes para manter sessoes, medir desempenho, entender uso da plataforma e viabilizar integracoes configuradas pelo lojista, como ferramentas de mensuracao.',
  },
  {
    title: '5. Retencao e seguranca',
    body: 'Mantemos dados pelo tempo necessario para prestar o servico, cumprir obrigacoes legais e proteger direitos. Aplicamos medidas tecnicas e organizacionais para reduzir riscos de acesso indevido.',
  },
  {
    title: '6. Direitos do titular',
    body: 'Voce pode solicitar acesso, correcao, exclusao, portabilidade ou informacoes sobre o tratamento dos seus dados, conforme a Lei Geral de Protecao de Dados.',
  },
  {
    title: '7. Contato de privacidade',
    body: 'Para exercer direitos ou tirar duvidas sobre privacidade, escreva para contato@lapamarketplace.com.br.',
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-z-bg">
      <MarketingNavbar />
      <main className="px-6 py-16 md:py-24">
        <article className="mx-auto max-w-3xl">
          <p className="text-[12px] font-bold uppercase tracking-[2px] text-z-green">
            Privacidade
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tighter text-z-text md:text-5xl">
            Politica de privacidade
          </h1>
          <p className="mt-4 text-sm text-z-text-muted">
            Ultima atualizacao: 29 de maio de 2026
          </p>
          <div className="mt-10 space-y-8 rounded-lg bg-white p-6 text-z-text md:p-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-bold text-z-text">{section.title}</h2>
                <p className="mt-3 leading-relaxed text-z-text-muted">{section.body}</p>
              </section>
            ))}
          </div>
        </article>
      </main>
      <MarketingFooter />
    </div>
  )
}
