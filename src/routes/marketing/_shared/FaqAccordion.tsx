import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { PlusSignIcon, MinusSignIcon } from '@hugeicons/core-free-icons'

const faqs = [
  {
    q: 'Posso cancelar a qualquer hora?',
    a: 'Sim. Não há fidelidade. Você pode cancelar a assinatura a qualquer momento direto no dashboard, sem multa. O acesso continua até o final do período já pago.',
  },
  {
    q: 'O trial precisa de cartão de crédito?',
    a: 'Não. Os 7 dias de trial são totalmente gratuitos e não exigem nenhum dado de pagamento. Só pedimos ao final do período se você quiser continuar.',
  },
  {
    q: 'Quantos produtos posso ter?',
    a: 'No plano Básico você tem até 10 produtos. No Pro, até 100. No Ilimitado, produtos ilimitados.',
  },
  {
    q: 'Como funciona o pedido pelo WhatsApp?',
    a: 'Quando o cliente finaliza o pedido no catálogo, o sistema gera automaticamente uma mensagem formatada com todos os detalhes e abre o WhatsApp da sua loja. Você recebe o pedido em segundos.',
  },
  {
    q: 'A IA realmente ajuda nas descrições?',
    a: 'Sim. Usamos a API do Gemini do Google. Basta dar o nome do produto e a IA gera uma descrição otimizada para vendas em segundos. Disponível nos planos Pro e Ilimitado.',
  },
  {
    q: 'Quais formas de pagamento da assinatura?',
    a: 'Cartão de crédito, PIX e boleto bancário. Tudo via Stripe Brasil, com NFSe emitida automaticamente.',
  },
]

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="flex flex-col">
      {faqs.map((f, i) => {
        const isOpen = open === i
        return (
          <div key={f.q} className="border-b border-z-border">
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-[15px] font-semibold">{f.q}</span>
              <HugeiconsIcon
                icon={isOpen ? MinusSignIcon : PlusSignIcon}
                size={18}
                className="shrink-0 text-z-text-hint"
              />
            </button>
            {isOpen && (
              <p className="pb-5 text-sm leading-relaxed text-z-text-muted">
                {f.a}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
