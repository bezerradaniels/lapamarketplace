import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSession } from '@/features/auth'
import { useActiveStore } from '@/lib/tenant'
import { deleteStore } from '@/features/catalog'
import { deleteAllCustomers } from '@/features/customers'
import { Button, Field } from '@/components/ui'
import { PhoneInput } from '@/components/forms/PhoneInput'
import { ImageCropUploader } from '@/components/forms/ImageCropUploader'
import { HugeiconsIcon } from '@hugeicons/react'
import { User02Icon, UserWarning02Icon } from '@hugeicons/core-free-icons'

const profileSchema = z.object({
  name: z.string().min(1, 'Informe seu nome').max(100, 'Máximo 100 caracteres'),
  whatsapp_phone: z.string().min(10, 'Informe um WhatsApp válido'),
})

type ProfileInput = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { user } = useSession()
  const { store } = useActiveStore()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: (user?.user_metadata?.name as string) ?? '',
      whatsapp_phone: (user?.user_metadata?.whatsapp_phone as string) ?? '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setSaveError(null)
    setIsSaving(true)
    try {
      const { createBrowserClient } = await import('@/lib/supabase')
      const supabase = createBrowserClient()

      const { error } = await supabase.auth.updateUser({
        data: {
          name: values.name,
          whatsapp_phone: values.whatsapp_phone,
          avatar_url: avatarUrl ?? undefined,
        },
      })

      if (error) throw error
    } catch {
      setSaveError('Não foi possível salvar. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  })

  async function handleDeleteAccount() {
    if (!store?.id) {
      alert('Erro: Loja não encontrada')
      return
    }
    if (!confirm('Tem certeza que deseja cancelar sua conta? Esta ação NÃO pode ser desfeita e excluirá:\n\n- Todos os dados da sua loja\n- Todos os produtos\n- Todos os clientes\n- Seu usuário\n\nDeseja continuar?')) return

    try {
      setIsDeleting(true)

      const { createBrowserClient } = await import('@/lib/supabase')
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      const userEmail = session?.user?.email

      await deleteAllCustomers(store.id)
      await deleteStore(store.id)

      if (userEmail) {
        try {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user-by-email`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: userEmail, dryRun: false, deleteOwnedStores: false }),
          })
        } catch {
          // Continue with sign out even if edge function fails
        }
      }

      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (err) {
      alert('Erro ao cancelar conta: ' + (err as Error).message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>Meu perfil</h1>
        <p className="mt-1 text-sm text-z-text-muted">
          Gerencie suas informações pessoais
        </p>
      </div>

      <div className="rounded-2xl border border-z-border bg-white p-8 shadow-z">
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          {/* Avatar */}
          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-semibold text-slate-950">
              Foto de perfil
            </span>
            <div className="flex items-center gap-4">
              {avatarUrl || user?.user_metadata?.avatar_url ? (
                <img
                  src={avatarUrl || (user?.user_metadata?.avatar_url as string)}
                  alt="Avatar"
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-z-bg2">
                  <HugeiconsIcon icon={User02Icon} size={32} className="text-z-text-hint" />
                </div>
              )}
              <ImageCropUploader
                bucket="store-logos"
                storeId={user?.id ?? ''}
                value={avatarUrl}
                onChange={setAvatarUrl}
                aspect={1}
                label="Alterar foto"
                hint="JPG, PNG ou WEBP. Formato quadrado."
              />
            </div>
          </div>

          {/* Name */}
          <Field
            label="Nome completo"
            placeholder="Seu nome"
            error={form.formState.errors.name?.message}
            {...form.register('name')}
          />

          {/* Email (read-only) */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-slate-950">
              E-mail
            </span>
            <div className="rounded-lg border border-z-border bg-z-bg px-3.5 py-2.5 text-sm text-z-text-muted">
              {user?.email}
            </div>
            <span className="text-xs text-z-text-hint">
              O e-mail não pode ser alterado
            </span>
          </div>

          {/* WhatsApp */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-slate-950">
              WhatsApp pessoal
            </span>
            <PhoneInput
              className="flex h-11 w-full rounded-lg border border-z-border bg-white px-3.5 text-sm outline-none placeholder:text-z-text-hint focus:border-z-green"
              value={form.watch('whatsapp_phone') ?? ''}
              onChange={(value: string) => form.setValue('whatsapp_phone', value)}
            />
            {form.formState.errors.whatsapp_phone && (
              <span className="text-xs text-destructive">
                {form.formState.errors.whatsapp_phone.message}
              </span>
            )}
          </div>

          {saveError && <p className="text-sm text-destructive">{saveError}</p>}

          <Button
            type="submit"
            disabled={isSaving}
            fullWidth
          >
            {isSaving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </form>
      </div>

      {/* Account Settings */}
      <div className="rounded-2xl border border-z-primary/30 bg-z-primary/10 p-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-z-primary/15">
            <HugeiconsIcon icon={UserWarning02Icon} size={20} className="text-z-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-z-text">Zona de atenção</h2>
            <p className="text-sm text-z-primary">Ações irreversíveis para sua conta</p>
          </div>
        </div>

        <div className="rounded-xl border border-z-primary/20 bg-white p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-z-text">Cancelar conta</h3>
            <p className="mt-1 text-sm text-z-text-muted">
              Esta ação excluirá permanentemente todos os dados da sua loja, produtos, clientes e seu usuário. Esta ação não pode ser desfeita.
            </p>
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="border-z-primary text-z-primary hover:bg-z-primary/10"
          >
            {isDeleting ? 'Cancelando...' : 'Cancelar minha conta'}
          </Button>
        </div>
      </div>
    </div>
  )
}
