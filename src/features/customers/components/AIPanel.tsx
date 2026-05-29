export function AIPanel() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-z-border bg-white p-5 text-center">
      {/* Illustration placeholder */}
      <div className="relative flex h-48 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-50 to-purple-100">
        <div className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-violet-600 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-violet-400" />
            Compra complementar
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-teal-600 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-teal-400" />
            Possível recorrência
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            Recorrência atrasada
          </span>
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm font-semibold text-z-text">
          Eu encontro oportunidades de vendas onde você não vê
        </p>
        <p className="text-xs text-z-text-muted leading-relaxed">
          Eu analiso os nossos clientes, pedidos e produtos e identifico as melhores oportunidades
          de negócio entre eles. Só preciso dos cadastros atualizados.
        </p>
      </div>
    </div>
  )
}
