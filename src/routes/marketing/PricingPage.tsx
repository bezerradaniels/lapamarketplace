import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight02Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { MarketingNavbar } from './_shared/MarketingNavbar'
import { MarketingFooter } from './_shared/MarketingFooter'
import { PricingTable } from './_shared/PricingTable'
import { FaqAccordion } from './_shared/FaqAccordion'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-z-bg">
      <MarketingNavbar />

      <section className="px-6 pb-16 pt-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <div className="text-[12px] font-bold uppercase tracking-[2px] text-z-green">
              Preços
            </div>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tighter md:text-5xl">
              Planos e preços
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-z-text-muted">
              Todos os planos incluem 7 dias grátis, sem cartão de crédito.
              Cancele quando quiser.
            </p>
          </div>
          <PricingTable />
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <div className="mb-12 text-center">
            <div className="text-[12px] font-bold uppercase tracking-[2px] text-z-green">
              FAQ
            </div>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tighter md:text-4xl">
              Dúvidas frequentes
            </h2>
          </div>
          <FaqAccordion />
        </div>
      </section>

      <section className="bg-z-ink px-6 py-20 text-center">
        <h2 className="mx-auto max-w-xl text-3xl font-extrabold tracking-tighter text-z-bg md:text-4xl">
          Pronto para começar a vender?
        </h2>
        <div className="mt-8">
          <Button asChild variant="lime" size="lg">
            <Link to={ROUTES.signup}>
              Criar minha loja grátis
              <HugeiconsIcon icon={ArrowRight02Icon} size={18} />
            </Link>
          </Button>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
