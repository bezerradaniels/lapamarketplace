export interface Category {
  id: string
  store_id: string
  parent_id: string | null
  name: string
  slug: string
  position: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CategoryWithChildren extends Category {
  children: Category[]
}
