import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { useActiveStore } from '@/lib/tenant'
import { useCustomer, useUpdateCustomer, useDeleteCustomer } from '@/features/customers'
import { CustomerForm } from '@/features/customers/components/CustomerForm'
import { ROUTES } from '@/config/routes'
import { toE164BR } from '@/lib/br'
import type { CustomerFormValues } from '@/features/customers/schemas/customerSchema'

export default function EditCustomerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { store, isLoading: storeLoading } = useActiveStore()
  const customer = useCustomer(id)
  const updateCustomer = useUpdateCustomer(id ?? '', store?.id ?? '')
  const deleteCustomer = useDeleteCustomer(store?.id ?? '')

  if (storeLoading || customer.isLoading) {
    return <p className="text-sm text-z-text-muted">Carregando...</p>
  }
  if (!store) return <Navigate to={ROUTES.onboarding} replace />
  if (!customer.data) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-z-text-muted">Cliente não encontrado.</p>
        <Link
          to={ROUTES.dashboardCustomers}
          className="text-sm font-medium text-z-green hover:underline"
        >
          Voltar
        </Link>
      </div>
    )
  }

  async function handleSubmit(values: CustomerFormValues) {
    await updateCustomer.mutateAsync({
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

  async function handleDelete() {
    if (!id) return
    if (!confirm(`Excluir o cliente "${customer.data!.name}"? Esta ação não pode ser desfeita.`)) return
    await deleteCustomer.mutateAsync(id)
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
        <h1 className="text-[22px] font-bold tracking-tighter">{customer.data.name}</h1>
      </header>

      <div className="overflow-hidden rounded-2xl border border-z-border bg-z-bg">
        <CustomerForm
          storeId={store.id}
          initial={customer.data}
          onSubmit={handleSubmit}
          onCancel={() => navigate(ROUTES.dashboardCustomers)}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}
