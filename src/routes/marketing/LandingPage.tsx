import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight02Icon,
  StoreLocation01Icon,
  PackageIcon,
  WhatsappIcon,
  DashboardSquare01Icon,
  AiMagicIcon,
  PaintBrush02Icon,
  CreditCardIcon,
  Tick02Icon,
  HomeIcon,
  ShoppingCart01Icon,
  UserGroupIcon,
  UserIcon,
  InvoiceIcon,
  Money02Icon,
  CustomerSupportIcon,
  Search01Icon,
  ShoppingBag03Icon,
  AnalyticsUpIcon,
  Notification02Icon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { Button, Badge } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { useSession } from '@/features/auth'
import type { User } from '@supabase/supabase-js'
import { MarketingNavbar } from './_shared/MarketingNavbar'
import { MarketingFooter } from './_shared/MarketingFooter'
import { PricingTable } from './_shared/PricingTable'

/* ─── Scroll-reveal hook ─────────────────────────────────────────────────── */
function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, visible }
}

function revealStyle(visible: boolean, delay = 0): React.CSSProperties {
  return {
    transitionProperty: 'opacity, transform',
    transitionDuration: '680ms',
    transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
    transitionDelay: visible ? `${delay}ms` : '0ms',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(26px)',
  }
}

/* ─── Shared components ──────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-[2.5px] text-z-green">
      {children}
    </div>
  )
}

/* ─── Hero visual ────────────────────────────────────────────────────────── */
function HeroMarketplaceImage() {
  return (
    <div className="relative -mt-16 flex h-full translate-x-16 items-end justify-end md:-mt-16 md:translate-x-0 md:justify-end z-0">
      <img
        src="/images/hero-model-marketplace.svg"
        alt="Modelo usando o Lapa Marketplace"
        width="1080"
        height="1350"
        fetchPriority="high"
        loading="eager"
        decoding="async"
        className="block w-full max-w-[400px] object-contain object-bottom md:max-w-[450px] lg:max-w-[520px]"
      />
      <div className="absolute left-2 top-36 flex h-12 w-12 items-center justify-center rounded-2xl bg-z-green text-white md:left-4 md:top-28 md:h-14 md:w-14">
        <HugeiconsIcon icon={WhatsappIcon} size={26} />
      </div>
      <div className="absolute left-0 top-52 flex items-center gap-2 rounded-2xl border border-z-border bg-white px-3 py-2 md:left-1 md:top-60">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-z-primary/10 text-z-primary">
          <HugeiconsIcon icon={Notification02Icon} size={18} />
        </div>
        <div>
          <p className="text-[11px] font-bold leading-none text-z-text">Nova venda</p>
          <p className="mt-1 text-[10px] text-z-text-muted">R$ 147,00</p>
        </div>
      </div>
      <div className="absolute right-24 top-36 flex h-12 w-12 items-center justify-center rounded-2xl bg-z-red text-white md:right-8 md:top-36 md:h-14 md:w-14">
        <HugeiconsIcon icon={ShoppingBag03Icon} size={24} />
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-z-primary px-1 text-[10px] font-bold text-white">
          3
        </span>
      </div>
      <div className="absolute right-20 top-64 flex items-center gap-2 rounded-2xl border border-z-border bg-white px-3 py-2 text-z-secondary md:right-0 md:top-64">
        <HugeiconsIcon icon={AnalyticsUpIcon} size={22} />
        <div>
          <p className="text-[11px] font-bold leading-none text-z-text">Vendas</p>
          <p className="mt-1 text-[10px] text-z-green">+32%</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
const HERO_BENEFITS = [
  'Crie seu catálogo em minutos.',
  'Divulgue o link da sua loja.',
  'Receba pedidos no Whatsapp.',
]

function getUserFirstName(user: User | null) {
  const metadataName = user?.user_metadata?.name
  const fullName = typeof metadataName === 'string' ? metadataName.trim() : ''
  const emailName = user?.email?.split('@')[0]?.replace(/[._-]+/g, ' ').trim()
  return (fullName || emailName || 'lojista').split(/\s+/)[0]
}

function getHeroGreeting(date: Date) {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'Bom dia ☀️'
  if (hour >= 12 && hour < 18) return 'Boa tarde 🚀'
  return 'Boa noite 🌙'
}

function getLoggedInHeroSub(date: Date) {
  const day = date.getDay()

  if (day === 1) {
    return '🚀 A semana está começando com boas oportunidades, vamos conquistar novos clientes juntos?'
  }

  if (day === 5) {
    return '🔥 Vamos fechar a semana com mais pedidos e novos clientes?'
  }

  if (day === 0 || day === 6) {
    return '✨ O fim de semana também tem potencial, vamos conquistar novos clientes juntos?'
  }

  return '💪 Esta semana tem potencial, vamos conquistar novos clientes juntos?'
}

function Hero() {
  const { session, user } = useSession()
  const now = new Date()
  const isLoggedIn = Boolean(session)
  const loggedInGreeting = `${getHeroGreeting(now)}, ${getUserFirstName(user)}.`

  return (
    <section className="relative overflow-hidden bg-white px-6 pb-0 pt-[26px] md:pt-[42px]">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
        style={{
          backgroundImage: "url('/images/hero-bg-marketplace.jpg')",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-12 md:grid md:grid-cols-[1fr_420px] md:items-end md:gap-8 md:min-h-[600px] lg:grid-cols-[1fr_500px]">
          {/* ── Copy section ── */}
          <div className="w-full text-center md:text-left md:self-center md:-translate-y-10 lg:-translate-y-12">
            {/* Headline */}
            <h1
              className={cn(
                'max-w-[22em] font-black text-z-text md:max-w-none',
                isLoggedIn
                  ? 'text-[34px] leading-[0.94] md:text-[52px] md:leading-[0.94]'
                  : 'text-[32px] leading-[1.06] md:text-[36px]',
              )}
            >
              {isLoggedIn ? (
                <>
                  <span className="block">{loggedInGreeting}</span>
                  <span className="block">Que bom ver você novamente.</span>
                </>
              ) : (
                'Aumente suas vendas em Bom Jesus da Lapa'
              )}
            </h1>

            {/* Subheading */}
            {isLoggedIn ? (
              <p className="mt-6 max-w-2xl text-[21px] font-semibold leading-snug text-z-text-muted md:text-[28px]">
                {getLoggedInHeroSub(now)}
              </p>
            ) : (
              <ul className="mt-5 max-w-xl space-y-3 text-base font-semibold leading-relaxed text-z-text-muted md:text-lg flex flex-col items-center md:items-start">
                {HERO_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-z-green text-white md:h-6 md:w-6">
                      <HugeiconsIcon icon={Tick02Icon} size={14} strokeWidth={2.5} />
                    </span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* CTA */}
            <div className="mt-9 flex flex-wrap justify-center gap-3 md:justify-start">
              <Button asChild size="lg" className="bg-sky-600 text-white hover:bg-sky-700">
                <Link id="lp-hero-cta-signup" to={isLoggedIn ? ROUTES.dashboard : ROUTES.signup}>
                  {isLoggedIn ? 'Ir para dashboard' : 'Crie seu catálogo de produtos'}
                  <HugeiconsIcon icon={ArrowRight02Icon} size={18} />
                </Link>
              </Button>
            </div>
          </div>

          {/* ── Hero image ── */}
          <HeroMarketplaceImage />
        </div>
      </div>
    </section>
  )
}

/* ─── Stats strip ────────────────────────────────────────────────────────── */
const STATS = [
  { 
    icon: StoreLocation01Icon, 
    value: '< 5 minutos', 
    label: 'para ter o catálogo no ar',
    bg: 'bg-z-primary',
  },
  { 
    icon: ShoppingCart01Icon, 
    value: 'Link próprio', 
    label: 'da sua loja online',
    bg: 'bg-z-red',
  },
  { 
    icon: WhatsappIcon, 
    value: 'WhatsApp', 
    label: 'como canal de pedidos',
    bg: 'bg-z-green',
  },
  { 
    icon: DashboardSquare01Icon, 
    value: 'Dashboard', 
    label: 'tudo em um único lugar',
    bg: 'bg-z-secondary',
  },
]

function StatsStrip() {
  const { ref, visible } = useReveal()
  return (
    <section className="bg-z-bg/50 px-6 py-16 sm:py-24" ref={ref}>
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.value}
              className="group flex flex-col items-center gap-5 rounded-[2rem] border border-black/[0.04] bg-white p-8 text-center transition-all duration-300 hover:-translate-y-1.5"
              style={revealStyle(visible, i * 90)}
            >
              <div className={cn("flex h-16 w-16 items-center justify-center rounded-[1.25rem] text-white transition-transform duration-500 group-hover:scale-110", s.bg)}>
                <HugeiconsIcon icon={s.icon} size={30} />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="text-[1.125rem] font-bold text-z-text">{s.value}</div>
                <div className="text-[0.9375rem] font-medium leading-relaxed text-z-text-muted">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── How it works ───────────────────────────────────────────────────────── */
const STEPS = [
  {
    icon: StoreLocation01Icon,
    title: 'Crie sua loja',
    desc: 'Cadastre-se, adicione logo, cores da sua marca e personalize o catálogo em poucos minutos.',
  },
  {
    icon: PackageIcon,
    title: 'Adicione seus produtos',
    desc: 'Cadastre produtos com fotos, variações e preços. Use IA para gerar descrições automaticamente.',
  },
  {
    icon: WhatsappIcon,
    title: 'Compartilhe e venda',
    desc: 'Envie o link pelo WhatsApp. Os pedidos chegam no dashboard em tempo real, formatados e prontos.',
  },
]

function HowItWorks() {
  const { ref, visible } = useReveal()
  return (
    <section id="como-funciona" className="bg-z-bg px-6 py-24">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-14 text-center" ref={ref}>
          <div style={revealStyle(visible, 0)}>
            <SectionLabel>Como funciona</SectionLabel>
          </div>
          <h2
            className="mt-3 text-3xl font-extrabold tracking-tighter md:text-4xl"
            style={revealStyle(visible, 60)}
          >
            Três passos para começar a vender
          </h2>
          <p
            className="mt-3 text-base text-z-text-muted"
            style={revealStyle(visible, 120)}
          >
            Sem complicação. Sem código. Sem mensalidade no primeiro mês.
          </p>
        </div>

        {/* Steps */}
        <StepsGrid />

        {/* CTA */}
        <div className="mt-12 text-center" style={revealStyle(visible, 400)}>
          <Button asChild variant="primary" size="lg">
            <Link id="lp-how-cta-signup" to={ROUTES.signup}>
              Comece grátis
              <HugeiconsIcon icon={ArrowRight02Icon} size={18} />
            </Link>
          </Button>
          <p className="mt-3 text-xs text-z-text-hint">
            Sem cartão de crédito · Cancele quando quiser
          </p>
        </div>
      </div>
    </section>
  )
}

function StepsGrid() {
  const { ref, visible } = useReveal()
  return (
    <div className="relative grid gap-6 md:grid-cols-3" ref={ref}>
      {/* Connector line */}
      <div className="absolute left-[16.5%] right-[16.5%] top-9 hidden h-px bg-z-border md:block" />

      {STEPS.map((step, i) => (
        <div
          key={step.title}
          className="relative z-10 rounded-2xl border border-z-border bg-white p-7 text-center transition-shadow hover:shadow-z-lg"
          style={revealStyle(visible, i * 120)}
        >
          <div className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-emerald-50 bg-emerald-500 text-white">
            <HugeiconsIcon icon={step.icon} size={26} />
          </div>
          <h3 className="text-[1.1875rem] font-bold">{step.title}</h3>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-z-text-muted">
            {step.desc}
          </p>
        </div>
      ))}
    </div>
  )
}

/* ─── Features ───────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: ShoppingCart01Icon,
    title: 'Catálogo online',
    desc: 'URL exclusiva, busca inteligente, categorias e grid otimizado para converter visitantes em clientes.',
    color: 'bg-emerald-500',
  },
  {
    icon: WhatsappIcon,
    title: 'Pedidos via WhatsApp',
    desc: 'Cada pedido vira uma mensagem formatada que chega direto no seu WhatsApp, pronta para atender.',
    color: 'bg-[#25D366]',
  },
  {
    icon: DashboardSquare01Icon,
    title: 'Dashboard completo',
    desc: 'Acompanhe pedidos, clientes e receita em tempo real, de qualquer dispositivo, a qualquer hora.',
    color: 'bg-emerald-500',
  },
  {
    icon: AiMagicIcon,
    title: 'IA integrada',
    desc: 'Gemini gera descrições de produtos, analisa perfis de clientes e sugere melhorias para o catálogo.',
    color: 'bg-violet-500',
  },
  {
    icon: PaintBrush02Icon,
    title: 'Personalização total',
    desc: 'Logo, banner, cores e slogan. Sua loja com a identidade visual da sua marca.',
    color: 'bg-emerald-500',
  },
  {
    icon: CreditCardIcon,
    title: 'Planos acessíveis',
    desc: 'A partir de R$ 9,90/mês. Cresça no seu ritmo sem surpresas na fatura.',
    color: 'bg-emerald-500',
  },
]

function Features() {
  const { ref, visible } = useReveal()
  return (
    <section id="funcionalidades" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-14 text-center" ref={ref}>
          <div style={revealStyle(visible, 0)}>
            <SectionLabel>Funcionalidades</SectionLabel>
          </div>
          <h2
            className="mt-3 text-3xl font-extrabold tracking-tighter md:text-4xl"
            style={revealStyle(visible, 60)}
          >
            Tudo que você precisa para vender mais
          </h2>
          <p
            className="mt-3 text-base text-z-text-muted"
            style={revealStyle(visible, 120)}
          >
            Ferramentas pensadas para o dia a dia de quem vende no Brasil.
          </p>
        </div>

        <FeaturesGrid />

        {/* CTA */}
        <div className="mt-14 text-center" style={revealStyle(visible, 500)}>
          <Button asChild variant="primary" size="lg">
            <Link id="lp-features-cta-signup" to={ROUTES.signup}>
              Comece grátis
              <HugeiconsIcon icon={ArrowRight02Icon} size={18} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function FeaturesGrid() {
  const { ref, visible } = useReveal()
  return (
    <div className="grid gap-4 md:grid-cols-3" ref={ref}>
      {FEATURES.map((f, i) => (
        <div
          key={f.title}
          className="group rounded-2xl border border-z-border bg-z-bg p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-z-lg"
          style={revealStyle(visible, i * 80)}
        >
          <div
            className={cn(
              'mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-white',
              f.color,
            )}
          >
            <HugeiconsIcon icon={f.icon} size={20} />
          </div>
          <h3 className="text-base font-bold">{f.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-z-text-muted">
            {f.desc}
          </p>
        </div>
      ))}
    </div>
  )
}

/* ─── Product preview ────────────────────────────────────────────────────── */
const SIDEBAR_ICONS = [
  HomeIcon,
  InvoiceIcon,
  PackageIcon,
  UserGroupIcon,
  UserIcon,
  DashboardSquare01Icon,
  Money02Icon,
  CustomerSupportIcon,
]

function ProductPreview() {
  const { ref, visible } = useReveal()
  return (
    <section className="overflow-hidden bg-gradient-to-br from-emerald-50 to-green-50 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-14 text-center" ref={ref}>
          <div style={revealStyle(visible, 0)}>
            <SectionLabel>O produto</SectionLabel>
          </div>
          <h2
            className="mt-3 text-3xl font-extrabold tracking-tighter md:text-4xl"
            style={revealStyle(visible, 60)}
          >
            Dashboard + catálogo em harmonia
          </h2>
          <p
            className="mt-3 text-base text-z-text-muted"
            style={revealStyle(visible, 120)}
          >
            Uma interface para gerenciar e outra para vender. Simples assim.
          </p>
        </div>

        <PreviewMockups visible={visible} />

        {/* CTA */}
        <div className="mt-14 text-center" style={revealStyle(visible, 500)}>
          <Button asChild variant="primary" size="lg">
            <Link id="lp-preview-cta-signup" to={ROUTES.signup}>
              Comece grátis
              <HugeiconsIcon icon={ArrowRight02Icon} size={18} />
            </Link>
          </Button>
          <p className="mt-3 text-sm text-z-text-hint">
            Sem cartão · Configure em menos de 5 minutos
          </p>
        </div>
      </div>
    </section>
  )
}

function PreviewMockups({ visible }: { visible: boolean }) {
  return (
    <div className="grid gap-5 md:grid-cols-[1.15fr_1fr]">
      {/* Dashboard mockup */}
      <div
        className="overflow-hidden rounded-2xl border border-black/8 bg-[#1e1e1e] shadow-z-lg"
        style={{
          ...revealStyle(visible, 180),
          transform: visible ? 'translateY(0)' : 'translateY(26px)',
        }}
      >
        <div className="flex items-center gap-1.5 border-b border-white/6 bg-[#252525] px-4 py-2.5">
          <span className="h-2 w-2 rounded-full bg-[#ff5f56]" />
          <span className="h-2 w-2 rounded-full bg-[#ffbd2e]" />
          <span className="h-2 w-2 rounded-full bg-[#27c93f]" />
          <span className="ml-2 text-[10px] text-white/30">
            Dashboard — Início
          </span>
        </div>
        <div className="flex h-72">
          <div className="flex w-14 flex-col items-center gap-3 border-r border-white/6 bg-z-ink py-3">
            {SIDEBAR_ICONS.map((Ic, i) => (
              <div
                key={i}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg',
                  i === 0 ? 'bg-z-green text-white' : 'text-white/40',
                )}
              >
                <HugeiconsIcon icon={Ic} size={16} />
              </div>
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-2.5 p-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Pedidos hoje', '14', '+3 ↑'],
                ['Receita', 'R$ 4.820', '↑ 18%'],
              ].map(([l, v, s]) => (
                <div key={l} className="rounded-lg bg-[#252525] px-3 py-2.5">
                  <div className="text-[9px] text-white/40">{l}</div>
                  <div className="text-base font-bold text-z-bg">{v}</div>
                  <div className="text-[9px] text-z-lime">{s}</div>
                </div>
              ))}
            </div>
            <div className="flex-1 rounded-lg bg-[#252525] p-3">
              <div className="mb-2 text-[10px] text-white/40">
                Últimos pedidos
              </div>
              {[
                ['#1041', 'Ana Souza', 'R$ 89,90', 'Pago', 'text-z-lime'],
                ['#1040', 'Carlos Lima', 'R$ 147,00', 'Novo', 'text-z-lilac'],
                ['#1039', 'Bruna M.', 'R$ 62,50', 'Preparo', 'text-yellow-400'],
              ].map(([id, n, v, st]) => (
                <div
                  key={id}
                  className="flex items-center justify-between border-b border-white/5 py-1.5 last:border-0"
                >
                  <span className="text-[10px] font-semibold text-z-green">
                    {id}
                  </span>
                  <span className="text-[10px] text-white/60">{n}</span>
                  <span className="text-[10px] font-semibold text-z-bg">
                    {v}
                  </span>
                  <Badge
                    tone={
                      st === 'Pago'
                        ? 'green'
                        : st === 'Novo'
                          ? 'lilac'
                          : 'amber'
                    }
                    className="text-[8px]"
                  >
                    {st}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Catalog mockup */}
      <div
        className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-z-lg"
        style={{
          ...revealStyle(visible, 280),
          transform: visible ? 'translateY(0)' : 'translateY(26px)',
        }}
      >
        <div className="flex h-[88px] flex-col items-center justify-center gap-1 bg-emerald-500 text-white">
          <HugeiconsIcon icon={StoreLocation01Icon} size={22} />
          <div className="text-sm font-bold">Loja da Dani</div>
          <div className="text-[10px] text-white/70">
            Moda feminina com estilo
          </div>
        </div>
        <div className="p-3.5">
          <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-[11px] text-z-text-hint">
            <HugeiconsIcon icon={Search01Icon} size={12} />
            <span>Buscar produtos...</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { name: 'Camiseta', price: '59,90', bg: 'from-pink-100 to-purple-100' },
              { name: 'Vestido', price: '89,90', bg: 'from-lime-100 to-green-100' },
              { name: 'Tênis', price: '179,90', bg: 'from-blue-100 to-indigo-100' },
              { name: 'Bolsa', price: '149,90', bg: 'from-orange-100 to-rose-100' },
            ].map((p) => (
              <div
                key={p.name}
                className="overflow-hidden rounded-xl border border-z-border bg-white"
              >
                <div
                  className={cn(
                    'h-16 bg-gradient-to-br',
                    p.bg,
                  )}
                />
                <div className="px-2.5 py-2">
                  <div className="text-[11px] font-semibold">{p.name}</div>
                  <div className="text-[11px] font-bold text-emerald-600">
                    R$ {p.price}
                  </div>
                  <div className="mt-1.5 rounded-md bg-emerald-500 py-1 text-center text-[10px] font-semibold text-white">
                    + Adicionar
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Pricing ────────────────────────────────────────────────────────────── */
function PricingSection() {
  const { ref, visible } = useReveal()
  return (
    <section id="precos" className="bg-z-bg px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center" ref={ref}>
          <div style={revealStyle(visible, 0)}>
            <SectionLabel>Planos e preços</SectionLabel>
          </div>
          <h2
            className="mt-3 text-3xl font-extrabold tracking-tighter md:text-4xl"
            style={revealStyle(visible, 60)}
          >
            Invista no crescimento da sua loja
          </h2>
          <p
            className="mt-3 text-base text-z-text-muted"
            style={revealStyle(visible, 120)}
          >
            Cancele quando quiser, sem burocracia.
          </p>
        </div>

        <div style={revealStyle(visible, 200)}>
          <PricingTable />
        </div>

        <div
          className="mt-10 text-center text-sm text-z-text-muted"
          style={revealStyle(visible, 350)}
        >
          Dúvidas sobre qual plano escolher?{' '}
          <a
            id="lp-pricing-link-faq"
            href="#faq"
            className="font-semibold text-z-green underline-offset-2 hover:underline"
          >
            Veja as perguntas frequentes
          </a>
        </div>
      </div>
    </section>
  )
}

/* ─── FAQ ────────────────────────────────────────────────────────────────── */
const FAQ_ITEMS = [
  {
    q: 'Preciso saber de tecnologia para usar o Lapa Marketplace?',
    a: 'Não. O Lapa Marketplace foi criado para ser simples. Se você consegue usar o WhatsApp, consegue usar o Lapa Marketplace. O cadastro leva menos de 5 minutos e o catálogo já fica disponível para seus clientes.',
  },
  {
    q: 'Como meus clientes fazem pedidos?',
    a: 'Seu cliente acessa o catálogo pelo link exclusivo da sua loja, escolhe os produtos e finaliza o pedido. Uma mensagem formatada é enviada direto para o seu WhatsApp com todos os detalhes do pedido.',
  },
  {
    q: 'O que acontece após o período de teste?',
    a: 'Se você não adicionar um método de pagamento, o catálogo público fica suspenso temporariamente — mas você mantém acesso ao dashboard para configurar o plano. Seus dados e produtos ficam salvos.',
  },
  {
    q: 'Posso trocar de plano ou cancelar quando quiser?',
    a: 'Sim. Upgrade acontece na hora. Downgrade e cancelamento têm efeito no final do período já pago. Sem multas, sem burocracia.',
  },
  {
    q: 'A loja fica acessível pelo celular?',
    a: 'Sim. O catálogo é totalmente responsivo e otimizado para mobile, que é como a maioria dos clientes de lojistas brasileiros acessa o link.',
  },
  {
    q: 'Quais formas de pagamento são aceitas para o plano?',
    a: 'Cartão de crédito (com recorrência automática), PIX e boleto bancário — todos em reais (BRL). Aceitamos os principais cartões do mercado.',
  },
]

function FAQ() {
  const { ref, visible } = useReveal()
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-14 text-center" ref={ref}>
          <div style={revealStyle(visible, 0)}>
            <SectionLabel>Dúvidas frequentes</SectionLabel>
          </div>
          <h2
            className="mt-3 text-3xl font-extrabold tracking-tighter md:text-4xl"
            style={revealStyle(visible, 60)}
          >
            Respostas para as principais dúvidas
          </h2>
        </div>

        <FaqList
          items={FAQ_ITEMS}
          open={open}
          setOpen={setOpen}
          visible={visible}
        />

        <div
          className="mt-12 text-center"
          style={revealStyle(visible, FAQ_ITEMS.length * 60 + 200)}
        >
          <p className="mb-4 text-sm text-z-text-muted">
            Não encontrou sua dúvida? A gente responde rápido.
          </p>
          <Button asChild variant="primary" size="lg">
            <Link id="lp-faq-cta-signup" to={ROUTES.signup}>
              Comece grátis
              <HugeiconsIcon icon={ArrowRight02Icon} size={18} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function FaqList({
  items,
  open,
  setOpen,
  visible,
}: {
  items: (typeof FAQ_ITEMS)[number][]
  open: number | null
  setOpen: (i: number | null) => void
  visible: boolean
}) {
  return (
    <div className="flex flex-col divide-y divide-z-border overflow-hidden rounded-2xl border border-z-border">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div
            key={i}
            className="bg-white"
            style={revealStyle(visible, i * 55)}
          >
            <button
              id={`lp-faq-toggle-${i + 1}`}
              type="button"
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-z-bg"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span className="text-sm font-semibold text-z-text">
                {item.q}
              </span>
              <span
                className="shrink-0 text-lg font-light leading-none text-z-text-muted transition-transform duration-300"
                style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
              >
                +
              </span>
            </button>
            <div
              className="overflow-hidden transition-all duration-300 ease-out"
              style={{ maxHeight: isOpen ? '300px' : '0px' }}
            >
              <p className="px-6 pb-5 text-sm leading-relaxed text-z-text-muted">
                {item.a}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Final CTA ──────────────────────────────────────────────────────────── */
function FinalCTA() {
  const { ref, visible } = useReveal()
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-100 via-green-50 to-lime-100 px-6 py-28 text-center">
      {/* Subtle radial accent */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-full"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(52,211,153,0.15) 0%, transparent 100%)',
        }}
      />

      <div className="relative mx-auto max-w-2xl" ref={ref}>
        <div style={revealStyle(visible, 0)}>
          <SectionLabel>Comece agora</SectionLabel>
        </div>

        <h2
          className="mx-auto mt-4 text-3xl font-extrabold leading-tight tracking-tightest text-z-text md:text-5xl"
          style={revealStyle(visible, 80)}
        >
          Sua loja merece um catálogo à altura.
        </h2>

        <p
          className="mt-4 text-base text-z-text-muted"
          style={revealStyle(visible, 140)}
        >
          Configure em menos de 5 minutos.{' '}
          <br className="hidden md:block" />
          Sem cartão de crédito.
        </p>

        <div className="mt-10" style={revealStyle(visible, 200)}>
          <Button asChild variant="primary" size="lg">
            <Link id="lp-final-cta-signup" to={ROUTES.signup}>
              Comece grátis
              <HugeiconsIcon icon={ArrowRight02Icon} size={18} />
            </Link>
          </Button>
        </div>

        <div
          className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2"
          style={revealStyle(visible, 260)}
        >
          {[
            'Sem cartão de crédito',
            'Cancele quando quiser',
            'Suporte em português',
          ].map((t) => (
            <div
              key={t}
              className="flex items-center gap-1.5 text-xs text-z-text-muted"
            >
              <HugeiconsIcon
                icon={Tick02Icon}
                size={13}
                className="text-emerald-500"
                strokeWidth={2.5}
              />
              {t}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNavbar />
      <Hero />
      <StatsStrip />
      <HowItWorks />
      <Features />
      <ProductPreview />
      <PricingSection />
      <FAQ />
      <FinalCTA />
      <MarketingFooter />
    </div>
  )
}
