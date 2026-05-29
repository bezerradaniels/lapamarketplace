import { Link } from 'react-router-dom'
import { ROUTES } from '@/config/routes'

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-muted-foreground">Página não encontrada.</p>
      <Link to={ROUTES.home} className="text-sm font-medium underline">
        Voltar para o início
      </Link>
    </main>
  )
}
