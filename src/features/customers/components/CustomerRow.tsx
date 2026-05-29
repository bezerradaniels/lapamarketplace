import { useState, useRef, useEffect } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  WhatsappIcon,
  ShoppingCart01Icon,
  Notification03Icon,
  MoreVerticalIcon,
  Edit02Icon,
  Delete02Icon,
} from '@hugeicons/core-free-icons'
import { fromE164BR } from '@/lib/br'
import type { Customer } from '../types'

type Props = {
  customer: Customer
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
]

function avatarColor(name: string) {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function CustomerRow({ customer, onEdit, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const phone = fromE164BR(customer.whatsapp_phone)
  const waHref = `https://wa.me/${customer.whatsapp_phone.replace('+', '')}`
  const colorClass = avatarColor(customer.name)

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-z-border bg-white px-4 py-3 transition-shadow hover:shadow-sm">
      {/* Avatar */}
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${colorClass}`}
      >
        {customer.avatar_url ? (
          <img
            src={customer.avatar_url}
            alt={customer.name}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          initials(customer.name)
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold leading-tight text-z-text">{customer.name}</p>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-z-text-muted hover:text-z-green"
        >
          <HugeiconsIcon icon={WhatsappIcon} size={12} />
          {phone}
        </a>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          title="Abrir WhatsApp"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-z-text-hint transition-colors hover:bg-z-bg2 hover:text-z-green"
        >
          <HugeiconsIcon icon={WhatsappIcon} size={18} />
        </a>
        <button
          type="button"
          title="Novo pedido"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-z-text-hint transition-colors hover:bg-z-bg2 hover:text-z-text"
        >
          <HugeiconsIcon icon={ShoppingCart01Icon} size={18} />
        </button>
        <button
          type="button"
          title="Notificações"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-z-text-hint transition-colors hover:bg-z-bg2 hover:text-z-text"
        >
          <HugeiconsIcon icon={Notification03Icon} size={18} />
        </button>

        {/* Three-dot menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-z-text-hint transition-colors hover:bg-z-bg2 hover:text-z-text"
          >
            <HugeiconsIcon icon={MoreVerticalIcon} size={18} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 min-w-[130px] overflow-hidden rounded-xl border border-z-border bg-white shadow-lg">
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onEdit(customer) }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-z-text transition-colors hover:bg-z-bg2"
              >
                <HugeiconsIcon icon={Edit02Icon} size={15} className="text-z-text-muted" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onDelete(customer) }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-z-primary transition-colors hover:bg-z-primary/10"
              >
                <HugeiconsIcon icon={Delete02Icon} size={15} />
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
