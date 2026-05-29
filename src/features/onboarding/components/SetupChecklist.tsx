import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle02Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  CircleIcon,
  Cancel01Icon,
  CheckListIcon as ClipboardListIcon,
} from '@hugeicons/core-free-icons'
import { ROUTES } from '@/config/routes'
import type { ChecklistState } from '../utils/checklistState'

type Task = {
  key: keyof ChecklistState
  label: string
  href: string
}

const TASKS: Task[] = [
  { key: 'hasProduct',  label: 'Adicionar primeiro produto',  href: '/dashboard/produtos/novo' },
  { key: 'hasLogo',     label: 'Adicionar logo',              href: `${ROUTES.dashboardCatalog}/aparencia` },
  { key: 'hasBanner',   label: 'Adicionar foto de capa',      href: `${ROUTES.dashboardCatalog}/aparencia` },
  { key: 'hasColor',    label: 'Escolher a cor do catálogo',  href: `${ROUTES.dashboardCatalog}/aparencia` },
  { key: 'hasAddress',  label: 'Adicionar seu endereço',      href: `${ROUTES.dashboardCatalog}/gerais` },
  { key: 'hasCategory', label: 'Criar uma categoria',         href: ROUTES.dashboardCategories },
  { key: 'hasCoupon',   label: 'Criar um cupom',              href: ROUTES.dashboardCoupons },
]

type SetupChecklistProps = {
  state: ChecklistState
  loading?: boolean
}

export function SetupChecklist({ state, loading }: SetupChecklistProps) {
  const [open, setOpen] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  const [hidden, setHidden] = useState(false)

  const done = TASKS.filter((t) => state[t.key]).length
  const total = TASKS.length
  const pendingTasks = TASKS.filter((task) => !state[task.key])
  const completedTasks = TASKS.filter((task) => state[task.key])

  if (done === total || hidden) return null

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    <div className="fixed bottom-24 right-5 z-50 lg:bottom-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Ver tarefas pendentes"
          className="relative flex h-14 items-center justify-center gap-1.5 rounded-full bg-z-primary px-4 text-white transition-opacity hover:opacity-90"
        >
          <HugeiconsIcon icon={ClipboardListIcon} size={22} className="shrink-0" />
          <span className="text-sm font-semibold leading-none">Tarefas pendentes</span>
          <span className="ml-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold leading-none">
            {loading ? '...' : `${done}/${total}`}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setHidden(true)
          }}
          aria-label="Esconder botão de tarefas pendentes"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-z-border bg-white text-z-text-muted transition-colors hover:bg-z-bg"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={16} />
        </button>
      </div>

      {open && (
        <div className="absolute bottom-16 right-0 w-[min(calc(100vw-2.5rem),360px)] rounded-xl border border-z-border bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-z-text">Tarefas pendentes</h2>
              <p className="mt-0.5 text-xs text-z-text-muted">
                {loading ? 'Verificando sua loja...' : `${done}/${total} concluídas`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar tarefas"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-z-text-muted hover:bg-z-bg"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>
          </div>

          <div className="flex flex-col gap-1">
            {pendingTasks.map((task) => (
              <Link
                key={task.key}
                to={task.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-z-bg"
              >
                <HugeiconsIcon
                  icon={CircleIcon}
                  size={20}
                  className="shrink-0 text-z-border"
                />
                <span className="min-w-0 flex-1 text-sm font-medium text-z-text">
                  {task.label}
                </span>
                <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-z-primary">
                  Fazer
                  <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
                </span>
              </Link>
            ))}
          </div>

          {done > 0 && (
            <div className="mt-3 border-t border-z-border pt-3">
              <button
                type="button"
                onClick={() => setShowCompleted((value) => !value)}
                aria-expanded={showCompleted}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-z-text-muted transition-colors hover:bg-z-bg"
              >
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="shrink-0 text-z-green" />
                <span className="min-w-0 flex-1">
                  {done} tarefa{done === 1 ? '' : 's'} concluída{done === 1 ? '' : 's'}
                </span>
                <HugeiconsIcon
                  icon={showCompleted ? ArrowUp01Icon : ArrowDown01Icon}
                  size={14}
                  className="shrink-0"
                />
              </button>

              {showCompleted && (
                <div className="mt-1 flex flex-col gap-1">
                  {completedTasks.map((task) => (
                    <Link
                      key={task.key}
                      to={task.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-z-text-muted transition-colors hover:bg-z-bg"
                    >
                      <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        size={18}
                        className="shrink-0 text-z-green"
                      />
                      <span className="min-w-0 flex-1">{task.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
    </>
  )
}
