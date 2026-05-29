import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { Tick02Icon, Store01Icon, ShoppingCartIcon, Payment01Icon } from '@hugeicons/core-free-icons'
import { signUpSchema, useSignUp, type SignUpInput } from '@/features/auth'
import { ROUTES } from '@/config/routes'
import { TRIAL_DAYS } from '@/config/plans'
import { Button, Field, Logo } from '@/components/ui'
import { cn } from '@/lib/utils'

const SIGNUP_DRAFT_KEY = 'lapa_signup_draft'

type SignupDraft = Pick<SignUpInput, 'name' | 'email' | 'accepted'>

function loadSignupDraft(): Partial<SignupDraft> | null {
  try {
    const raw = localStorage.getItem(SIGNUP_DRAFT_KEY)
    return raw ? (JSON.parse(raw) as Partial<SignupDraft>) : null
  } catch {
    return null
  }
}

function saveSignupDraft(data: SignupDraft): void {
  try {
    localStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(data))
  } catch {}
}

function clearSignupDraft(): void {
  try {
    localStorage.removeItem(SIGNUP_DRAFT_KEY)
  } catch {}
}

export default function SignupPage() {
  const navigate = useNavigate()
  const signUp = useSignUp()
  const draft = loadSignupDraft()

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: draft?.name ?? '',
      email: draft?.email ?? '',
      password: '',
      passwordConfirm: '',
      accepted: draft?.accepted ?? false,
    },
  })

  useEffect(() => {
    const { unsubscribe } = form.watch((values) => {
      saveSignupDraft({
        name: values.name ?? '',
        email: values.email ?? '',
        accepted: values.accepted ?? false,
      })
    })

    return unsubscribe
  }, [form])

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await signUp.mutateAsync(values)
    clearSignupDraft()

    if (result.session) {
      navigate(ROUTES.onboarding)
    } else {
      navigate(ROUTES.confirmEmail, { state: { email: values.email } })
    }
  })

  const accepted = form.watch('accepted')

  return (
    <div className="flex h-screen w-full">
      {/* Left Column - Marketing */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center bg-z-primary px-16">
        <h1 className="text-5xl font-bold text-white mb-4">
          Crie sua loja online em minutos
        </h1>
        <p className="text-xl text-white mb-12">
          {TRIAL_DAYS} dias grátis, sem cartão de crédito
        </p>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15">
              <HugeiconsIcon icon={Store01Icon} size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Crie sua loja</h3>
              <p className="text-sm text-white">
                Configure sua loja com nome, categoria e identidade visual
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15">
              <HugeiconsIcon icon={ShoppingCartIcon} size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Adicione produtos</h3>
              <p className="text-sm text-white">
                Cadastre seus produtos com fotos, preços e descrições
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15">
              <HugeiconsIcon icon={Payment01Icon} size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Receba pedidos</h3>
              <p className="text-sm text-white">
                Receba pedidos diretamente no seu WhatsApp
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center bg-z-bg px-6 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Logo height={58} className="mb-8" />
          <h2 className="text-3xl font-bold text-z-text mb-2">Criar sua conta</h2>
          <p className="text-sm text-z-text-muted mb-8">
            Comece gratuitamente hoje mesmo
          </p>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Field
              label="Nome completo"
              autoComplete="name"
              placeholder="Seu nome"
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
                <label className="mt-2 flex cursor-pointer items-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    aria-pressed={field.value}
                    className={cn(
                      'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-2 transition-colors',
                      field.value
                        ? 'border-z-green bg-z-green'
                        : 'border-z-border bg-white',
                    )}
                  >
                    {field.value && (
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        size={11}
                        className="text-white"
                        strokeWidth={3}
                      />
                    )}
                  </button>
                  <span className="text-[13px] leading-snug text-z-text-muted">
                    Li e aceito os Termos de uso e a Política de privacidade
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
            >
              {signUp.isPending ? 'Criando...' : 'Criar conta'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
