import { useAdminStats, StatCard, MiniBarChart } from '@/features/admin'

const PLAN_LABELS: Record<string, string> = {
  basico: 'Básico',
  pro: 'Pro',
  premium: 'Premium',
}

function formatBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">{children}</h2>
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="mb-4 text-sm font-medium text-gray-700">{title}</p>
      {children}
    </div>
  )
}

function RankTable({ rows, labelKey, countKey }: { rows: Record<string, unknown>[]; labelKey: string; countKey: string }) {
  if (!rows.length) {
    return <p className="text-xs text-gray-500">Sem dados</p>
  }
  const max = Math.max(...rows.map((r) => Number(r[countKey])), 1)
  return (
    <div className="space-y-2">
      {rows.map((row, i) => {
        const label = String(row[labelKey] ?? '—')
        const count = Number(row[countKey])
        const pct = (count / max) * 100
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-xs text-gray-700">{label}</span>
            <div className="flex-1 rounded-full bg-gray-100">
              <div
                className="h-1.5 rounded-full bg-emerald-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-6 text-right text-xs font-medium text-gray-500">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function AdminHomePage() {
  const { data: stats, isLoading, error } = useAdminStats()

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-500">
        Carregando estatísticas...
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-red-400">
        Erro ao carregar dados. Verifique as permissões.
      </div>
    )
  }

  const totalSubscribed = stats.paying_customers + stats.trial_customers

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-950">Visão Geral</h1>
        <p className="mt-1 text-sm text-gray-500">Dados consolidados de toda a plataforma</p>
      </div>

      {/* Main KPIs */}
      <section>
        <SectionTitle>Métricas principais</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Usuários" value={stats.total_users} color="blue" />
          <StatCard label="Lojas" value={stats.total_stores} color="green" />
          <StatCard label="Produtos" value={stats.total_products} color="purple" />
          <StatCard label="Vendedores" value={stats.total_sellers} color="amber" />
          <StatCard label="Pagantes" value={stats.paying_customers} color="rose" />
        </div>
      </section>

      {/* Subscription breakdown */}
      <section>
        <SectionTitle>Assinaturas</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-500">Pagantes (ativos)</p>
            <p className="mt-1 text-3xl font-bold text-emerald-700">{stats.paying_customers}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-500">Em trial</p>
            <p className="mt-1 text-3xl font-bold text-amber-700">{stats.trial_customers}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-500">Total com plano</p>
            <p className="mt-1 text-3xl font-bold text-gray-950">{totalSubscribed}</p>
            <p className="mt-1 text-xs text-gray-600">
              {stats.total_stores > 0
                ? `${Math.round((totalSubscribed / stats.total_stores) * 100)}% das lojas`
                : '—'}
            </p>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section>
        <SectionTitle>Crescimento</SectionTitle>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Novas lojas por mês">
            <MiniBarChart
              data={(stats.stores_per_month ?? []).map((d) => ({
                label: d.month.slice(5),
                value: d.count,
              }))}
              color="#10b981"
            />
          </ChartCard>

          <ChartCard title="Receita de assinaturas por mês (R$)">
            <MiniBarChart
              data={(stats.revenue_per_month ?? []).map((d) => ({
                label: d.month.slice(5),
                value: d.amount,
              }))}
              color="#6366f1"
              formatValue={(v) => formatBRL(v)}
            />
          </ChartCard>
        </div>
      </section>

      {/* Geographic & category breakdown */}
      <section>
        <SectionTitle>Distribuição geográfica e por setor</SectionTitle>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-medium text-gray-700">Top cidades</p>
            <RankTable
              rows={(stats.cities_with_stores ?? []) as Record<string, unknown>[]}
              labelKey="city"
              countKey="count"
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-medium text-gray-700">Estados</p>
            <RankTable
              rows={(stats.states_with_stores ?? []) as Record<string, unknown>[]}
              labelKey="state"
              countKey="count"
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-medium text-gray-700">Ramo de atuação</p>
            <RankTable
              rows={(stats.sectors_with_stores ?? []) as Record<string, unknown>[]}
              labelKey="sector"
              countKey="count"
            />
          </div>
        </div>
      </section>
    </div>
  )
}

// suppress unused warning — used only in JSX
void PLAN_LABELS
