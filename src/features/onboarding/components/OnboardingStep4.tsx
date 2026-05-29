import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { HugeiconsIcon } from '@hugeicons/react'
import { Store01Icon } from '@hugeicons/core-free-icons'
import { Button, Label } from '@/components/ui'
import { ImageCropUploader } from '@/components/forms/ImageCropUploader'
import { patchStore, catalogKeys } from '@/features/catalog'
import { ROUTES } from '@/config/routes'
import { loadOnboardingSession } from '../utils/onboardingSession'
import { saveDraft, loadDraft } from '../utils/onboardingDraft'
import { step4Schema, type Step4Values } from '../schemas'
import { cn } from '@/lib/utils'

const COLOR_PRESETS = [
  { label: 'Verde', value: '#34d399' },
  { label: 'Esmeralda', value: '#10b981' },
  { label: 'Azul', value: '#2563eb' },
  { label: 'Roxo', value: '#7c3aed' },
  { label: 'Rosa', value: '#db2777' },
  { label: 'Laranja', value: '#ea580c' },
  { label: 'Vermelho', value: '#dc2626' },
  { label: 'Preto', value: '#111827' },
]

function isPresetColor(color: string | undefined): boolean {
  return COLOR_PRESETS.some((preset) => preset.value === color)
}

export function OnboardingStep4() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const session = loadOnboardingSession()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const draft = loadDraft<Step4Values>(4)
  const initialColor = draft?.primary_color ?? '#34d399'
  const [useCustomColor, setUseCustomColor] = useState(!isPresetColor(initialColor))

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<Step4Values>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      primary_color: initialColor,
      logo_url: draft?.logo_url ?? '',
      banner_url: draft?.banner_url ?? '',
    },
  })

  useEffect(() => {
    const { unsubscribe } = watch((values) => saveDraft(4, values))
    return unsubscribe
  }, [watch])

  if (!session) return <Navigate to={ROUTES.onboardingStep1} replace />

  const selectedColor = watch('primary_color')
  const activeColor = selectedColor

  const onSubmit = async (values: Step4Values) => {
    setIsSubmitting(true)
    try {
      await patchStore(session.storeId, {
        primary_color: activeColor,
        logo_url: values.logo_url || null,
        banner_url: values.banner_url || null,
      })
      await queryClient.invalidateQueries({ queryKey: catalogKeys.all })
      navigate(ROUTES.onboardComplete)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Algo deu errado. Tente novamente.'
      setError('root', { message: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      <div>
        <h1 className="text-xl font-semibold text-z-text">Visual da sua loja</h1>
        <p className="mt-1 text-sm text-z-text-muted">
          Personalize as cores e imagens que seus clientes vão ver.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Cor principal do catálogo</Label>
        <div className="flex flex-col gap-3">
          {/* Preset swatches */}
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                title={preset.label}
                onClick={() => {
                  setValue('primary_color', preset.value, { shouldValidate: true })
                  setUseCustomColor(false)
                }}
                className={cn(
                  'relative h-9 w-9 rounded-full transition-transform hover:scale-110',
                  !useCustomColor && selectedColor === preset.value
                    ? 'ring-2 ring-z-ink ring-offset-2'
                    : '',
                )}
                style={{ backgroundColor: preset.value }}
              >
                {!useCustomColor && selectedColor === preset.value && (
                  <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Custom color row */}
          <div className="flex items-center gap-2">
            <label className="relative cursor-pointer" title="Escolher cor personalizada">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => {
                  setUseCustomColor(true)
                  setValue('primary_color', e.target.value, { shouldValidate: true })
                }}
                className="sr-only"
              />
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed transition-all hover:scale-110',
                  useCustomColor ? 'border-z-ink ring-2 ring-z-ink ring-offset-2' : 'border-z-border',
                )}
                style={{ backgroundColor: useCustomColor ? selectedColor : 'transparent' }}
              >
                {!useCustomColor && (
                  <span className="text-lg leading-none text-z-text-hint">+</span>
                )}
                {useCustomColor && (
                  <span className="text-white text-xs font-bold">✓</span>
                )}
              </div>
            </label>
            <input
              type="text"
              value={selectedColor.toUpperCase()}
              onChange={(e) => {
                const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`
                if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                  setUseCustomColor(!isPresetColor(v))
                  setValue('primary_color', v, { shouldValidate: true })
                }
              }}
              maxLength={7}
              placeholder="#000000"
              className="h-9 w-28 rounded-lg border border-z-border px-3 text-sm font-mono text-z-text outline-none focus:border-z-green"
            />
            <div
              className="h-9 w-9 rounded-full border border-z-border shadow-sm"
              style={{ backgroundColor: selectedColor }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Logo da loja</Label>
        <p className="text-xs text-z-text-hint">Proporção 1:1 recomendada. JPG, PNG ou WEBP.</p>
        <Controller
          name="logo_url"
          control={control}
          render={({ field }) => (
            <ImageCropUploader
              bucket="store-logos"
              storeId={session.storeId}
              value={field.value || null}
              onChange={(url) => {
                setValue('logo_url', url ?? '', { shouldDirty: true, shouldValidate: true })
              }}
              aspect={1}
              label="Logo"
            />
          )}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Foto de capa do catálogo</Label>
        <p className="text-xs text-z-text-hint">Proporção 16:10 recomendada. JPG, PNG ou WEBP.</p>
        <Controller
          name="banner_url"
          control={control}
          render={({ field }) => (
            <ImageCropUploader
              bucket="store-logos"
              storeId={session.storeId}
              value={field.value || null}
              onChange={(url) => {
                setValue('banner_url', url ?? '', { shouldDirty: true, shouldValidate: true })
              }}
              aspect={16 / 10}
              label="Capa"
            />
          )}
        />
      </div>

      {errors.root && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {errors.root.message}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => navigate(ROUTES.onboardingStep3)}
          disabled={isSubmitting}
          className="flex-1"
        >
          ← Voltar
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting} className="flex-[2]">
          {isSubmitting ? 'Finalizando...' : 'Começar a vender'}
          {!isSubmitting && <HugeiconsIcon icon={Store01Icon} size={20} />}
        </Button>
      </div>
    </form>
  )
}
