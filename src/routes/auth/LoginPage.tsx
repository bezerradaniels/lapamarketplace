import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { signInSchema, useSignIn, type SignInInput } from '@/features/auth'
import { ROUTES } from '@/config/routes'
import { isAdminEmail } from '@/config/admin'
import { Button, Field } from '@/components/ui'
import { AuthShell } from './_shared/AuthShell'

export default function LoginPage() {
  const navigate = useNavigate()
  const signIn = useSignIn()
  const form = useForm<SignInInput>({ resolver: zodResolver(signInSchema) })

  const onSubmit = form.handleSubmit(async (values) => {
    const data = await signIn.mutateAsync(values)
    navigate(isAdminEmail(data.user?.email) ? ROUTES.admin : ROUTES.dashboard)
  })

  return (
    <AuthShell title="Entrar na sua conta" subtitle="Bem-vindo de volta 👋">
      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
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
          autoComplete="current-password"
          placeholder="Sua senha"
          error={form.formState.errors.password?.message}
          {...form.register('password')}
        />
        <div className="-mt-1 text-right">
          <Link
            to={ROUTES.forgotPassword}
            className="text-sm font-medium text-z-green hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>

        {signIn.isError && (
          <p className="text-sm text-destructive">
            Não foi possível entrar. Verifique e-mail e senha.
          </p>
        )}

        <Button type="submit" disabled={signIn.isPending} fullWidth>
          {signIn.isPending ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-z-text-muted">
        Não tem conta?{' '}
        <Link
          to={ROUTES.signup}
          className="font-semibold text-z-green hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </AuthShell>
  )
}
