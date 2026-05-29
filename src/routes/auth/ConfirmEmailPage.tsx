import { useState } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { HugeiconsIcon } from '@hugeicons/react'
import { Mail01Icon, ArrowLeft02Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { z } from 'zod'
import { useVerifyOtp } from '@/features/auth'
import { createBrowserClient } from '@/lib/supabase'
import { Button, Field } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { AuthShell } from './_shared/AuthShell'

const otpSchema = z.object({
  code: z
    .string()
    .min(6, 'O código deve ter pelo menos 6 dígitos')
    .max(10, 'Código inválido')
    .regex(/^\d+$/, 'O código deve conter apenas números'),
})

type OtpInput = z.infer<typeof otpSchema>

export default function ConfirmEmailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = (location.state as { email?: string })?.email ?? ''

  const [isResending, setIsResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verifyOtp = useVerifyOtp()

  const form = useForm<OtpInput>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: '' },
  })

  const handleResend = async () => {
    if (!email) return
    setIsResending(true)
    setError(null)
    try {
      const supabase = createBrowserClient()
      const { error: err } = await supabase.auth.resend({
        type: 'signup',
        email,
      })
      if (err) throw err
      setResent(true)
      setTimeout(() => setResent(false), 6000)
    } catch {
      setError('Não foi possível reenviar o código. Tente novamente.')
    } finally {
      setIsResending(false)
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null)
    try {
      await verifyOtp.mutateAsync({ email, token: values.code, type: 'email' })
      navigate(ROUTES.onboarding)
    } catch {
      setError('Código inválido ou expirado. Verifique e tente novamente.')
    }
  })

  return (
    <AuthShell
      title="Confirme seu e-mail"
      subtitle={
        email ? (
          <>
            Enviamos um código de confirmação para{' '}
            <strong className="text-z-text">{email}</strong>
          </>
        ) : (
          'Verifique sua caixa de entrada para ativar sua conta.'
        )
      }
      width={420}
    >
      {/* Icon */}
      <div className="mb-6 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-z-bg2 text-z-green">
          <HugeiconsIcon icon={Mail01Icon} size={28} />
        </div>
      </div>

      {/* Steps */}
      <ol className="mb-6 flex flex-col gap-3">
        {[
          'Abra o e-mail que acabamos de enviar',
          'Copie o código de confirmação',
          'Cole o código abaixo para confirmar',
        ].map((text, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-z-green text-[11px] font-bold text-white">
              {i + 1}
            </span>
            <span className="text-sm text-z-text-muted leading-snug">{text}</span>
          </li>
        ))}
      </ol>

      <p className="mb-5 text-center text-xs text-z-text-hint">
        Verifique também a pasta de spam ou lixo eletrônico.
      </p>

      {/* OTP Form */}
      <form onSubmit={onSubmit} className="mb-4 flex flex-col gap-3">
        <Field
          label="Código de confirmação"
          type="text"
          inputMode="numeric"
          placeholder="12345678"
          maxLength={10}
          error={form.formState.errors.code?.message || (error ?? undefined)}
          {...form.register('code')}
        />

        <Button
          type="submit"
          disabled={verifyOtp.isPending}
          fullWidth
        >
          {verifyOtp.isPending ? 'Verificando...' : 'Confirmar código'}
        </Button>
      </form>

      {/* Resend */}
      {email && (
        <Button
          variant="ghost"
          fullWidth
          onClick={handleResend}
          disabled={isResending || resent}
        >
          {resent ? (
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={Tick02Icon} size={14} className="text-z-green" strokeWidth={3} />
              Código reenviado!
            </span>
          ) : isResending ? (
            'Reenviando...'
          ) : (
            'Reenviar código'
          )}
        </Button>
      )}

      <div className="mt-4 text-center">
        <Link
          to={ROUTES.login}
          className="inline-flex items-center gap-1 text-sm font-medium text-z-green hover:underline"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={14} />
          Voltar ao login
        </Link>
      </div>
    </AuthShell>
  )
}
