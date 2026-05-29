import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  HelpCircleIcon,
  WhatsappIcon,
  Mail01Icon,
  ArrowRightIcon,
} from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui'

const CHANNELS: { icon: IconSvgElement; label: string; value: string; href: string }[] = [
  {
    icon: WhatsappIcon,
    label: 'WhatsApp',
    value: 'Resposta em até 30 min',
    href: 'https://wa.me/5500000000000',
  },
  {
    icon: Mail01Icon,
    label: 'E-mail',
    value: 'lapamarketplace@gmail.com',
    href: 'mailto:lapamarketplace@gmail.com',
  },
  {
    icon: HelpCircleIcon,
    label: 'Central de ajuda',
    value: 'Tutoriais e FAQ',
    href: 'https://lapamarketplace.com.br/ajuda',
  },
]

export default function SupportPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-[22px] font-bold tracking-tighter">Suporte</h1>
        <p className="text-sm text-z-text-muted">
          Estamos por perto. Escolha o canal que preferir.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {CHANNELS.map((c) => (
          <a
            key={c.label}
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-3 rounded-2xl border border-z-border bg-white p-6 transition-shadow hover:shadow-z"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-z-bg2 text-z-green">
              <HugeiconsIcon icon={c.icon} size={22} />
            </div>
            <div>
              <div className="text-base font-semibold">{c.label}</div>
              <div className="text-sm text-z-text-muted">{c.value}</div>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-z-green">
              Abrir <HugeiconsIcon icon={ArrowRightIcon} size={14} />
            </span>
          </a>
        ))}
      </section>

      <section className="rounded-2xl border border-z-border bg-white p-6">
        <h2 className="mb-1 text-base font-semibold">Envie uma mensagem</h2>
        <p className="mb-4 text-sm text-z-text-muted">
          Nosso time responde de segunda a sexta, das 9h às 18h.
        </p>
        <form className="flex flex-col gap-3">
          <textarea
            placeholder="Como podemos ajudar?"
            rows={5}
            className="w-full rounded-lg border border-z-border bg-white px-3.5 py-2.5 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
          />
          <div className="flex justify-end">
            <Button type="submit">Enviar</Button>
          </div>
        </form>
      </section>
    </div>
  )
}
