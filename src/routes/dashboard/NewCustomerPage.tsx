import { useNavigate } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { useActiveStore } from '@/lib/tenant'
import { useCreateCustomer } from '@/features/customers'
import { CustomerForm } from '@/features/customers/components/CustomerForm'
import { ROUTES } from '@/config/routes'
import { toE164BR } from '@/lib/br'
import type { CustomerFormValues } from '@/features/customers/schemas/customerSchema'

export default function NewCustomerPage() {
  const navigate = useNavigate()
  const { store } = useActiveStore()
  const createCustomer = useCreateCustomer(store?.id ?? '')

  async function handleSubmit(values: CustomerFormValues) {
    if (!store) return
    await createCustomer.mutateAsync({
      ...values,
      whatsapp_phone: toE164BR(values.whatsapp_phone),
      secondary_phone: values.secondary_phone ? toE164BR(values.secondary_phone) : null,
      email: values.email || null,
      website: values.website || null,
      cpf_cnpj: values.cpf_cnpj || null,
      birthday: values.birthday || null,
      profile_notes: values.profile_notes || null,
    })
    navigate(ROUTES.dashboardCustomers)
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3 px-1">
        <button
          type="button"
          onClick={() => navigate(ROUTES.dashboardCustomers)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted transition-colors hover:bg-z-bg2 hover:text-z-text"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={18} />
        </button>
        <h1 className="text-[22px] font-bold tracking-tighter">Novo cliente</h1>
      </header>

      <div className="overflow-hidden rounded-2xl border border-z-border bg-z-bg">
        {store && (
          <CustomerForm
            storeId={store.id}
            onSubmit={handleSubmit}
            onCancel={() => navigate(ROUTES.dashboardCustomers)}
          />
        )}
      </div>
    </div>
  )
}
