import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Cancel01Icon,
  PlusSignIcon,
  Delete02Icon,
  SortingIcon,
  ColorPickerIcon,
  RulerIcon,
  Settings01Icon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import type { VariationType, VariationOption } from '@/types/domain'

type SharedProps = {
  productName?: string
  productStock?: number | null
  initialType?: VariationType | null
  initialLabel?: string | null
  initialOptions?: VariationOption[] | null
  onSave: (type: VariationType, label: string, options: VariationOption[]) => void
  onClose: () => void
}

type Props = SharedProps & { open: boolean }

const COLOR_PRESETS = ['Preto', 'Branco', 'Cinza', 'Amarelo', 'Vermelho', 'Verde', 'Azul', 'Roxo', 'Rosa']
const SIZE_PRESETS = ['PP', 'P', 'M', 'G', 'GG', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44']

const TYPE_OPTIONS = [
  { value: 'color' as VariationType, label: 'Cor', icon: ColorPickerIcon },
  { value: 'size' as VariationType, label: 'Tamanho', icon: RulerIcon },
  { value: 'other' as VariationType, label: 'Outro tipo', icon: Settings01Icon },
]

function optionAttributeValue(option: VariationOption, label: string) {
  return option.attributes?.[label] ?? option.name
}

function inferExtraLabels(options: VariationOption[] | null | undefined, mainLabel?: string | null) {
  const labels: string[] = []
  ;(options ?? []).forEach((option) => {
    Object.keys(option.attributes ?? {}).forEach((label) => {
      if (label !== mainLabel && !labels.includes(label)) labels.push(label)
    })
  })
  return labels
}

export function ProductVariationModal({ open, ...rest }: Props) {
  if (!open) return null
  return <ModalContent key="variation-modal" {...rest} />
}

function ModalContent({
  productName,
  productStock,
  initialType,
  initialLabel,
  initialOptions,
  onSave,
  onClose,
}: SharedProps) {
  const [type, setType] = useState<VariationType>(initialType ?? 'color')
  const [customLabel, setCustomLabel] = useState(
    initialType === 'other' ? (initialLabel ?? '') : '',
  )
  const [extraLabels, setExtraLabels] = useState<string[]>(
    inferExtraLabels(initialOptions, initialLabel),
  )
  const [options, setOptions] = useState<VariationOption[]>(
    initialOptions?.length ? initialOptions : [{ name: '' }],
  )

  const label =
    type === 'color' ? 'Cor' : type === 'size' ? 'Tamanho' : customLabel || 'Outro tipo'
  const currentProductName = productName?.trim() ?? ''

  const presets = type === 'color' ? COLOR_PRESETS : type === 'size' ? SIZE_PRESETS : []

  const addPreset = (name: string) => {
    if (
      options.some(
        (o) => optionAttributeValue(o, label).toLowerCase() === name.toLowerCase(),
      )
    ) {
      return
    }
    const lastEmpty = options.findIndex((o) => !o.name.trim())
    if (lastEmpty >= 0) {
      setOptions(
        options.map((o, i) =>
          i === lastEmpty ? { ...o, name, attributes: { ...(o.attributes ?? {}), [label]: name } } : o,
        ),
      )
    } else {
      setOptions([...options, { name, attributes: { [label]: name } }])
    }
  }

  const addOption = () => setOptions([...options, { name: '' }])

  const addExtraLabel = () => setExtraLabels([...extraLabels, ''])

  const updateExtraLabel = (index: number, nextLabel: string) => {
    const previousLabel = extraLabels[index]
    setExtraLabels(extraLabels.map((item, i) => (i === index ? nextLabel : item)))
    if (!previousLabel || previousLabel === nextLabel) return
    setOptions(
      options.map((option) => {
        const attributes = { ...(option.attributes ?? {}) }
        if (attributes[previousLabel] !== undefined) {
          attributes[nextLabel] = attributes[previousLabel]
          delete attributes[previousLabel]
        }
        return { ...option, attributes }
      }),
    )
  }

  const removeExtraLabel = (index: number) => {
    const removedLabel = extraLabels[index]
    setExtraLabels(extraLabels.filter((_, i) => i !== index))
    if (!removedLabel) return
    setOptions(
      options.map((option) => {
        const attributes = { ...(option.attributes ?? {}) }
        delete attributes[removedLabel]
        return { ...option, attributes }
      }),
    )
  }

  const addCurrentProductOption = () => {
    const name = currentProductName
    if (!name) return
    if (options.some((o) => o.name.trim().toLowerCase() === name.toLowerCase())) return

    const currentProductOption: VariationOption = {
      name,
      stock: productStock ?? null,
      attributes: { [label]: name },
    }
    const filledOptions = options.filter((o) => o.name.trim())
    setOptions([currentProductOption, ...filledOptions])
  }

  const removeOption = (i: number) => {
    if (options.length === 1) {
      setOptions([{ name: '' }])
    } else {
      setOptions(options.filter((_, idx) => idx !== i))
    }
  }

  const updateOption = (i: number, name: string) =>
    setOptions(
      options.map((o, idx) =>
        idx === i
          ? { ...o, name, attributes: { ...(o.attributes ?? {}), [label]: name } }
          : o,
      ),
    )

  const updateOptionAttribute = (i: number, attributeLabel: string, value: string) =>
    setOptions(
      options.map((o, idx) => {
        if (idx !== i) return o
        const attributes = { ...(o.attributes ?? {}) }
        if (value.trim()) {
          attributes[attributeLabel] = value
        } else {
          delete attributes[attributeLabel]
        }
        return { ...o, attributes }
      }),
    )

  const updateOptionStock = (i: number, stock: number | null) =>
    setOptions(options.map((o, idx) => (idx === i ? { ...o, stock } : o)))

  const handleSave = () => {
    const filled = options
      .filter((o) => o.name.trim())
      .map((o) => {
        const attributes = { ...(o.attributes ?? {}), [label]: o.name.trim() }
        extraLabels
          .map((extraLabel) => extraLabel.trim())
          .filter(Boolean)
          .forEach((extraLabel) => {
            const value = attributes[extraLabel]?.trim()
            if (value) {
              attributes[extraLabel] = value
            } else {
              delete attributes[extraLabel]
            }
          })
        const cleanAttributes = Object.fromEntries(
          Object.entries(attributes).filter(([key, value]) => key.trim() && value.trim()),
        )

        return {
          name:
            Object.keys(cleanAttributes).length > 1
              ? Object.values(cleanAttributes).join(' / ')
              : o.name.trim(),
          image_url: null,
          stock: o.stock ?? null,
          sku: o.sku ?? null,
          attributes: cleanAttributes,
        }
      })
    onSave(type, label, filled)
    onClose()
  }

  const canSave = options.some((o) => o.name.trim())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-z-pop">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-z-border px-6 py-4">
          <h2 className="text-base font-semibold text-z-text">
            Tipo da variação principal
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted transition-colors hover:bg-z-bg2 hover:text-z-text"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Step 1 */}
          <div className="border-b border-z-border px-6 py-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-z-text text-[11px] font-bold text-white">
                1
              </span>
              <span className="text-sm font-medium text-z-text">
                Qual é o tipo de variação principal deste produto?
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors',
                    type === opt.value
                      ? 'border-z-green bg-z-green/10 text-z-green'
                      : 'border-z-border text-z-text-muted hover:border-z-text hover:text-z-text',
                  )}
                >
                  <HugeiconsIcon icon={opt.icon} size={16} />
                  {opt.label}
                </button>
              ))}
            </div>

            {type === 'other' && (
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Ex: Material, Voltagem, Sabor..."
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  className="h-10 w-full rounded-lg border border-z-border px-3 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                />
              </div>
            )}

            {type !== 'other' && (
              <div className="mt-2 rounded-lg border border-z-border bg-z-bg px-3 py-2 text-sm text-z-text-muted">
                <span className="inline-flex items-center gap-1.5 font-medium text-z-text">
                  <HugeiconsIcon icon={type === 'color' ? ColorPickerIcon : RulerIcon} size={16} />
                  {type === 'color' ? 'Cor' : 'Tamanho'}
                </span>
              </div>
            )}

            <div className="mt-4 rounded-xl border border-z-border bg-z-bg p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-z-text-hint">
                    Variações combinadas
                  </p>
                  <p className="mt-1 text-xs text-z-text-muted">
                    Use quando a opção depender de mais de uma escolha, como jogador e tipo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addExtraLabel}
                  className="shrink-0 rounded-lg border border-z-border bg-white px-2.5 py-1.5 text-xs font-medium text-z-text transition-colors hover:border-z-green hover:text-z-green"
                >
                  + Tipo
                </button>
              </div>

              {extraLabels.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {extraLabels.map((extraLabel, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Ex: Tamanho, Acabamento, Time..."
                        value={extraLabel}
                        onChange={(e) => updateExtraLabel(index, e.target.value)}
                        className="h-9 min-w-0 flex-1 rounded-lg border border-z-border bg-white px-3 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                      />
                      <button
                        type="button"
                        onClick={() => removeExtraLabel(index)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-z-text-muted transition-colors hover:bg-z-primary/10 hover:text-z-primary"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Step 2 */}
          <div className="px-6 py-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-z-text text-[11px] font-bold text-white">
                2
              </span>
              <div className="min-w-0">
                <span className="block text-sm font-medium text-z-text">
                  Que opções de "{label}" este produto possui?
                </span>
                <span className="block text-xs text-z-text-muted">
                  Inclua todas as versões vendáveis, inclusive a versão atual do produto.
                </span>
              </div>
            </div>

            {presets.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium text-z-text-muted">
                  Adicionar rápido:
                </span>
                {presets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => addPreset(p)}
                    className="rounded-lg border border-z-border px-2.5 py-1 text-xs font-medium text-z-text transition-colors hover:border-z-green hover:bg-z-green/5 hover:text-z-green"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {currentProductName && (
              <button
                type="button"
                onClick={addCurrentProductOption}
                disabled={options.some(
                  (o) =>
                    o.name.trim().toLowerCase() === currentProductName.toLowerCase(),
                )}
                className="mb-4 inline-flex items-center gap-2 rounded-xl border border-z-border bg-white px-3 py-2 text-sm font-medium text-z-text transition-colors hover:border-z-green hover:text-z-green disabled:cursor-not-allowed disabled:opacity-50"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={15} />
                Adicionar produto atual como opção
              </button>
            )}

            <div className="flex flex-col gap-2">
              {options.map((opt, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-z-border bg-white p-3"
                >
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_120px_auto] items-end gap-2 max-sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                    <span className="mb-1 flex h-8 w-8 cursor-grab items-center justify-center text-z-text-hint">
                      <HugeiconsIcon icon={SortingIcon} size={16} />
                    </span>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold text-z-text-hint">
                        {label}
                      </span>
                      <input
                        type="text"
                        placeholder={
                          type === 'color'
                            ? 'Ex: Azul ou Rosa'
                            : type === 'size'
                              ? 'Ex: P, M ou G'
                              : 'Ex: Opção 1'
                        }
                        value={optionAttributeValue(opt, label)}
                        onChange={(e) => updateOption(i, e.target.value)}
                        className="h-10 w-full rounded-lg border border-z-border px-3 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 max-sm:hidden">
                      <span className="text-[11px] font-semibold text-z-text-hint">
                        Estoque
                      </span>
                      <input
                        type="number"
                        min={0}
                        placeholder="Ilimitado"
                        value={opt.stock ?? ''}
                        onChange={(e) =>
                          updateOptionStock(
                            i,
                            e.target.value === '' ? null : Number(e.target.value),
                          )
                        }
                        className="h-10 w-full rounded-lg border border-z-border px-3 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted transition-colors hover:bg-z-primary/10 hover:text-z-primary"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={16} />
                    </button>
                  </div>

                  {/* Stock field visible on mobile below the main row */}
                  <div className="ml-10 mt-2 hidden max-sm:block">
                    <span className="text-[11px] font-semibold text-z-text-hint">
                      Estoque
                    </span>
                    <input
                      type="number"
                      min={0}
                      placeholder="Ilimitado"
                      value={opt.stock ?? ''}
                      onChange={(e) =>
                        updateOptionStock(
                          i,
                          e.target.value === '' ? null : Number(e.target.value),
                        )
                      }
                      className="mt-1.5 h-10 w-full rounded-lg border border-z-border px-3 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                    />
                  </div>

                  {extraLabels.filter((extraLabel) => extraLabel.trim()).length > 0 && (
                    <div className="ml-10 mt-3 grid gap-2 sm:grid-cols-2">
                      {extraLabels
                        .map((extraLabel) => extraLabel.trim())
                        .filter(Boolean)
                        .map((extraLabel) => (
                          <div key={extraLabel} className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-semibold text-z-text-hint">
                              {extraLabel}
                            </span>
                            <input
                              type="text"
                              placeholder={`Ex: ${extraLabel}`}
                              value={opt.attributes?.[extraLabel] ?? ''}
                              onChange={(e) =>
                                updateOptionAttribute(i, extraLabel, e.target.value)
                              }
                              className="h-10 w-full rounded-lg border border-z-border px-3 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                            />
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addOption}
              className="mt-3 flex items-center gap-1.5 rounded-xl border border-dashed border-z-border px-3 py-2 text-sm text-z-text-muted transition-colors hover:border-z-green hover:text-z-green"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={14} />
              Adicionar opção
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-z-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-z-border px-4 py-2 text-sm font-medium text-z-text-muted transition-colors hover:bg-z-bg2"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="rounded-xl bg-z-green px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          >
            Definir a variação
          </button>
        </div>
      </div>
    </div>
  )
}
