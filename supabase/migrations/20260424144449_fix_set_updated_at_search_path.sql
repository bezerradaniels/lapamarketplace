-- Pins `search_path` on `public.set_updated_at` to silence the
-- `function_search_path_mutable` Supabase advisor.

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;
