import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight02Icon } from '@hugeicons/core-free-icons'
import { Button, Combobox, Input, Label } from '@/components/ui'
import { PhoneInput } from '@/components/forms/PhoneInput'
import { track } from '@/features/analytics'
import { STATES, toE164BR } from '@/lib/br'
import { createStore, SlugTakenError, patchStore } from '@/features/catalog'
import { slugify } from '@/lib/utils/slugify'
import { ROUTES } from '@/config/routes'
import { loadOnboardingSession, saveOnboardingSession } from '../utils/onboardingSession'
import { saveDraft, loadDraft } from '../utils/onboardingDraft'
import { useCities } from '../hooks/useCities'
import { step1Schema, type Step1Values } from '../schemas'
import { cn } from '@/lib/utils'

const STATE_OPTIONS = STATES.map((s) => ({ value: s.uf, label: s.name }))

export function OnboardingStep1() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const draft = loadDraft<Step1Values>(1)
  const onboardingSession = loadOnboardingSession()

  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: draft?.name ?? '',
      whatsapp_phone: draft?.whatsapp_phone ?? '',
      address_state: draft?.address_state ?? 'BA',
      address_city: draft?.address_city ?? 'Bom Jesus da Lapa',
      address_street: draft?.address_street ?? '',
      address_neighborhood: draft?.address_neighborhood ?? '',
    },
  })

  useEffect(() => {
    const { unsubscribe } = watch((values) => saveDraft(1, values))
    return unsubscribe
  }, [watch])

  const selectedState = watch('address_state')
  const { data: cityOptions = [], isLoading: loadingCities } = useCities(selectedState || null)

  const onSubmit = async (values: Step1Values) => {
    setIsSubmitting(true)
    try {
      const isNewStore = !onboardingSession
      let store = onboardingSession
        ? {
            id: onboardingSession.storeId,
            slug: onboardingSession.storeSlug,
            name: values.name,
          }
        : null

      if (!store) {
        const baseSlug = slugify(values.name)

        try {
          store = await createStore({
            name: values.name,
            slug: baseSlug,
            primary_color: '#34d399',
            whatsapp_phone: values.whatsapp_phone,
          })
        } catch (err) {
          if (err instanceof SlugTakenError) {
            const suffix = Math.floor(100 + Math.random() * 900)
            store = await createStore({
              name: values.name,
              slug: `${baseSlug.slice(0, 36)}-${suffix}`,
              primary_color: '#34d399',
              whatsapp_phone: values.whatsapp_phone,
            })
          } else {
            throw err
          }
        }
      }

      await patchStore(store.id, {
        name: values.name,
        whatsapp_phone: toE164BR(values.whatsapp_phone),
        address_state: values.address_state,
        address_city: values.address_city,
        address_street: values.address_street || null,
        address_neighborhood: values.address_neighborhood || null,
      })

      saveOnboardingSession({
        storeId: store.id,
        storeSlug: store.slug,
        storeName: store.name,
      })

      if (isNewStore) {
        track('store_created', { store_id: store.id, store_slug: store.slug })
      }
      track('onboarding_step_completed', { step: 1, step_name: 'Sua loja' })

      navigate(ROUTES.onboardingStep2)
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Algo deu errado. Tente novamente.'
      setError('root', { message: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div>
        <h1 className="text-xl font-semibold text-z-text">Dados da sua loja</h1>
        <p className="mt-1 text-sm text-z-text-muted">
          Essas informações identificam sua loja para os clientes.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome da loja *</Label>
        <Input
          id="name"
          placeholder="Ex: Moda da Ana"
          className={cn(errors.name && 'border-red-400')}
          {...register('name')}
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="whatsapp_phone">WhatsApp para receber pedidos *</Label>
        <Controller
          name="whatsapp_phone"
          control={control}
          render={({ field }) => (
            <PhoneInput
              id="whatsapp_phone"
              value={field.value}
              onChange={field.onChange}
              className={cn(errors.whatsapp_phone && 'border-red-400')}
            />
          )}
        />
        {errors.whatsapp_phone && (
          <p className="text-xs text-red-500">{errors.whatsapp_phone.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address_state">Estado *</Label>
          <Controller
            name="address_state"
            control={control}
            render={({ field }) => (
              <Combobox
                options={STATE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                placeholder="Digite para buscar..."
                emptyMessage="Estado não encontrado"
              />
            )}
          />
          {errors.address_state && (
            <p className="text-xs text-red-500">{errors.address_state.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address_city">Cidade *</Label>
          <Controller
            name="address_city"
            control={control}
            render={({ field }) => (
              <Combobox
                options={cityOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder={
                  !selectedState ? 'Selecione o estado primeiro' : 'Digite para buscar...'
                }
                disabled={!selectedState}
                loading={loadingCities}
                emptyMessage="Cidade não encontrada"
              />
            )}
          />
          {errors.address_city && (
            <p className="text-xs text-red-500">{errors.address_city.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address_street">
            Endereço{' '}
            <span className="text-z-text-hint text-xs font-normal normal-case">(aparece no rodapé)</span>
          </Label>
          <Input
            id="address_street"
            placeholder="Ex: Rua das Flores, 123"
            {...register('address_street')}
          />
          {errors.address_street && (
            <p className="text-xs text-red-500">{errors.address_street.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address_neighborhood">
            Bairro{' '}
            <span className="text-z-text-hint text-xs font-normal normal-case">(aparece no rodapé)</span>
          </Label>
          <Input
            id="address_neighborhood"
            placeholder="Ex: Centro"
            {...register('address_neighborhood')}
          />
          {errors.address_neighborhood && (
            <p className="text-xs text-red-500">{errors.address_neighborhood.message}</p>
          )}
        </div>
      </div>

      {errors.root && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {errors.root.message}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
        {isSubmitting ? 'Criando sua loja...' : 'Próxima etapa'}
        {!isSubmitting && <HugeiconsIcon icon={ArrowRight02Icon} size={20} />}
      </Button>
    </form>
  )
}
