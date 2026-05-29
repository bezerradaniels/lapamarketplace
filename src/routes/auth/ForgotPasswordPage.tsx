import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { Mail01Icon, ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import {
  forgotPasswordSchema,
  useResetPassword,
  type ForgotPasswordInput,
} from '@/features/auth'
import { ROUTES } from '@/config/routes'
import { Button, Field } from '@/components/ui'
import { AuthShell } from './_shared/AuthShell'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const reset = useResetPassword()
  const [sentTo, setSentTo] = useState<string | null>(null)

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    await reset.mutateAsync(values.email)
    setSentTo(values.email)
  })

  if (sentTo) {
    return (
      <AuthShell
        title="Verifique seu e-mail"
        subtitle={
          <>
            Enviamos um link de recuperação para{' '}
            <strong className="text-z-text">{sentTo}</strong>. Verifique também
            a pasta de spam.
          </>
        }
        width={400}
      >
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-z-bg2 text-z-green">
            <HugeiconsIcon icon={Mail01Icon} size={26} />
          </div>
        </div>
        <Button
          variant="ghost"
          fullWidth
          onClick={() => navigate(ROUTES.login)}
        >
          Voltar ao login
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="Enviaremos um link para o seu e-mail."
      width={400}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <Field
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          error={form.formState.errors.email?.message}
          {...form.register('email')}
        />
        {reset.isError && (
          <p className="text-sm text-destructive">
            Não foi possível enviar o e-mail. Tente novamente.
          </p>
        )}
        <Button type="submit" disabled={reset.isPending} fullWidth>
          {reset.isPending ? 'Enviando...' : 'Enviar link de recuperação'}
        </Button>
      </form>
      <div className="mt-5 text-center">
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
