import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Tick02Icon,
  StoreLocation01Icon,
  PackageIcon,
  WhatsappIcon,
  ArrowRight02Icon,
} from '@hugeicons/core-free-icons'
import { signUpSchema, useSignUp, type SignUpInput } from '@/features/auth'
import { ROUTES } from '@/config/routes'
import { TRIAL_DAYS } from '@/config/plans'
import { Button, Field, Logo } from '@/components/ui'
import { cn } from '@/lib/utils'

const STEPS = [
  {
    icon: StoreLocation01Icon,
    title: 'Crie sua loja',
    desc: 'Logo, cores e link exclusivo em menos de 5 minutos.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: PackageIcon,
    title: 'Adicione seus produtos',
    desc: 'Fotos, variações e preços — com ajuda de IA para descrever.',
    color: 'bg-violet-100 text-violet-600',
  },
  {
    icon: WhatsappIcon,
    title: 'Receba pedidos',
    desc: 'Clientes compram pelo link e o pedido chega no seu WhatsApp.',
    color: 'bg-green-100 text-green-600',
  },
]


export default function TrialSignupPage() {
  const navigate = useNavigate()
  const signUp = useSignUp()

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '', passwordConfirm: '', accepted: false },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    await signUp.mutateAsync(values)
    navigate(ROUTES.onboarding)
  })

  const accepted = form.watch('accepted')

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-white via-emerald-50 to-violet-50 lg:h-screen lg:overflow-hidden">

      {/* Decorative blobs */}
      <div
        className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(0,168,45,0.18) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-[420px] w-[420px] rounded-full opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)' }}
      />

      {/* ── Inner constrained layout ───────────────────────────────────── */}
      <div className="relative mx-auto flex w-full max-w-[1140px] flex-1 flex-col lg:h-full lg:flex-row">

        {/* ── Left: value prop ─────────────────────────────────────────── */}
        <div className="flex flex-col px-8 py-10 lg:w-[52%] lg:overflow-y-auto lg:px-12 lg:py-12">
          {/* Logo */}
          <div className="mb-10">
            <Logo variant="verde" height={40} />
          </div>

          <div className="flex-1">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-z-green/20 bg-z-green/8 px-3.5 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-z-green" />
              <span className="text-xs font-semibold text-z-text">{TRIAL_DAYS} dias grátis · Sem cartão de crédito</span>
            </div>

            <h1 className="text-[2rem] font-extrabold leading-[1.1] tracking-tighter text-z-text lg:text-[2.5rem]">
              Venda mais com um{' '}
              <span className="text-z-green">catálogo digital.</span>
            </h1>

            <p className="mt-4 max-w-sm text-base leading-relaxed text-z-text-muted">
              Crie um catálogo digital, compartilhe o link e receba pedidos organizados
              diretamente no seu WhatsApp.
            </p>

            {/* Mobile-only CTA */}
            <div className="mt-6 lg:hidden">
              <Button variant="primary" size="lg" fullWidth onClick={() => document.getElementById('trial-form')?.scrollIntoView({ behavior: 'smooth' })}>
                Iniciar teste grátis
                <HugeiconsIcon icon={ArrowRight02Icon} size={18} />
              </Button>
            </div>

            {/* Steps */}
            <div className="mt-8 flex flex-col gap-5">
              {STEPS.map((step) => (
                <div key={step.title} className="flex items-start gap-4">
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', step.color)}>
                    <HugeiconsIcon icon={step.icon} size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-z-text">{step.title}</span>
                    </div>
                    <p className="mt-0.5 text-sm leading-snug text-z-text-muted">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── Right: form card ─────────────────────────────────────────── */}
        <div className="relative flex flex-1 flex-col items-center justify-center px-8 py-12 lg:overflow-y-auto lg:px-14">
          <div id="trial-form" className="w-full max-w-md rounded-2xl border border-z-border bg-white p-8 shadow-z-lg">

            {/* Form header */}
            <div className="mb-7">
              <h2 className="text-2xl font-extrabold tracking-tight text-z-text">
                Crie sua conta grátis
              </h2>
              <p className="mt-1.5 text-sm text-z-text-muted">
                Comece hoje. Sem compromisso. Cancele quando quiser.
              </p>
            </div>

            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
              <Field
                label="Seu nome"
                autoComplete="name"
                placeholder="Como você se chama?"
                error={form.formState.errors.name?.message}
                {...form.register('name')}
              />
              <Field
                label="E-mail"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                error={form.formState.errors.email?.message}
                {...form.register('email')}
              />
              <Field
                label="Senha"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                error={form.formState.errors.password?.message}
                {...form.register('password')}
              />
              <Field
                label="Confirmar senha"
                type="password"
                autoComplete="new-password"
                placeholder="Repita sua senha"
                error={form.formState.errors.passwordConfirm?.message}
                {...form.register('passwordConfirm')}
              />

              <Controller
                control={form.control}
                name="accepted"
                render={({ field }) => (
                  <label className="mt-1 flex cursor-pointer items-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => field.onChange(!field.value)}
                      aria-pressed={field.value}
                      className={cn(
                        'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-2 transition-colors',
                        field.value ? 'border-z-green bg-z-green' : 'border-z-border bg-white',
                      )}
                    >
                      {field.value && (
                        <HugeiconsIcon icon={Tick02Icon} size={11} className="text-white" strokeWidth={3} />
                      )}
                    </button>
                    <span className="text-[13px] leading-snug text-z-text-muted">
                      Li e aceito os{' '}
                      <a
                        href="/termos"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-z-green underline-offset-2 hover:underline"
                      >
                        Termos de uso
                      </a>{' '}
                      e a{' '}
                      <a
                        href="/privacidade"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-z-green underline-offset-2 hover:underline"
                      >
                        Política de privacidade
                      </a>
                    </span>
                  </label>
                )}
              />
              {form.formState.errors.accepted && (
                <span className="-mt-1 text-xs text-destructive">
                  {form.formState.errors.accepted.message}
                </span>
              )}

              {signUp.isError && (
                <p className="text-sm text-destructive">
                  {signUp.error instanceof Error &&
                  signUp.error.message.toLowerCase().includes('rate limit')
                    ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
                    : 'Não foi possível criar a conta. Verifique os dados e tente novamente.'}
                </p>
              )}

              <Button
                type="submit"
                disabled={signUp.isPending || !accepted}
                fullWidth
                size="lg"
                className="mt-1"
              >
                {signUp.isPending ? (
                  'Criando sua conta...'
                ) : (
                  <>
                    Começar {TRIAL_DAYS} dias grátis
                    <HugeiconsIcon icon={ArrowRight02Icon} size={18} />
                  </>
                )}
              </Button>
            </form>

            {/* Security note */}
            <div className="mt-4 flex items-center justify-center gap-1.5">
              <HugeiconsIcon icon={Tick02Icon} size={12} className="text-z-green" strokeWidth={2.5} />
              <span className="text-xs text-z-text-hint">
                Sem cartão de crédito · Seus dados protegidos
              </span>
            </div>

          </div>
        </div>

      </div>{/* end inner constrained layout */}
    </div>
  )
}
