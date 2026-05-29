import { createBrowserClient } from '@/lib/supabase'
import type { Category } from '../types'

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export interface CreateCategoryInput {
  store_id: string
  name: string
  parent_id?: string | null
  position?: number
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const supabase = createBrowserClient()
  const payload = {
    store_id: input.store_id,
    parent_id: input.parent_id ?? null,
    name: input.name.trim(),
    slug: slugify(input.name),
    position: input.position ?? 0,
  }
  const { data, error } = await supabase
    .from('categories')
    .insert(payload)
    .select('*')
    .single()
  if (error) throw error
  return data as Category
}

export interface UpdateCategoryInput {
  id: string
  name?: string
  position?: number
}

export async function updateCategory(input: UpdateCategoryInput): Promise<Category> {
  const supabase = createBrowserClient()
  const payload: { name?: string; slug?: string; position?: number } = {}
  if (input.name !== undefined) {
    payload.name = input.name.trim()
    payload.slug = slugify(input.name)
  }
  if (input.position !== undefined) payload.position = input.position
  const { data, error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', input.id)
    .select('*')
    .single()
  if (error) throw error
  return data as Category
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = createBrowserClient()
  const { error } = await supabase
    .from('categories')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
