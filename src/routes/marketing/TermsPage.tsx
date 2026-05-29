import { MarketingFooter } from './_shared/MarketingFooter'
import { MarketingNavbar } from './_shared/MarketingNavbar'

const sections = [
  {
    title: '1. Aceite dos termos',
    body: 'Ao acessar ou usar o Lapa Marketplace, voce concorda com estes Termos de uso. Se nao concordar com alguma condicao, nao utilize a plataforma.',
  },
  {
    title: '2. Uso da plataforma',
    body: 'O Lapa Marketplace oferece ferramentas para criacao de catalogos digitais, gestao de produtos, pedidos e atendimento comercial. O lojista e responsavel pelas informacoes publicadas, pelos produtos ofertados e pelo relacionamento com seus clientes.',
  },
  {
    title: '3. Cadastro e seguranca',
    body: 'Voce deve fornecer dados verdadeiros e manter suas credenciais protegidas. Atividades realizadas com sua conta poderao ser consideradas de sua responsabilidade.',
  },
  {
    title: '4. Planos, pagamentos e cancelamento',
    body: 'Recursos pagos, periodo de avaliacao, valores e condicoes comerciais sao apresentados nas paginas de contratacao. O cancelamento pode limitar ou suspender funcionalidades da loja conforme o plano vigente.',
  },
  {
    title: '5. Conteudo e condutas proibidas',
    body: 'Nao e permitido publicar conteudo ilegal, enganoso, ofensivo, que viole direitos de terceiros ou que seja usado para fraude, spam, abuso da plataforma ou atividades contrarias a lei brasileira.',
  },
  {
    title: '6. Disponibilidade e alteracoes',
    body: 'Trabalhamos para manter a plataforma estavel, mas podem ocorrer interrupcoes, manutencoes ou alteracoes de funcionalidades. Podemos atualizar estes termos quando necessario.',
  },
  {
    title: '7. Contato',
    body: 'Para duvidas sobre estes termos, entre em contato pelo e-mail contato@lapamarketplace.com.br.',
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-z-bg">
      <MarketingNavbar />
      <main className="px-6 py-16 md:py-24">
        <article className="mx-auto max-w-3xl">
          <p className="text-[12px] font-bold uppercase tracking-[2px] text-z-green">
            Legal
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tighter text-z-text md:text-5xl">
            Termos de uso
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
