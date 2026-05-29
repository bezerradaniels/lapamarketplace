export type CustomerSocialLink = {
  platform: 'instagram' | 'facebook' | 'x' | 'youtube' | 'kwai' | 'tiktok' | 'whatsapp'
  value: string
}

export type Customer = {
  id: string
  store_id: string
  name: string
  whatsapp_phone: string // E.164
  secondary_phone: string | null
  cpf_cnpj_type: 'cpf' | 'cnpj'
  cpf_cnpj: string | null
  birthday: string | null // "DD/MM"
  email: string | null
  website: string | null
  social_links: CustomerSocialLink[]
  avatar_url: string | null
  profile_notes: string | null
  seller_id: string | null
  tags: string[]
  category_interests: string[]
  product_interests: string[]
  created_at: string
  updated_at: string
}
