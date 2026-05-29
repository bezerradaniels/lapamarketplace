create or replace function public.sync_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    coalesce(new.email, new.raw_user_meta_data->>'email', ''),
    nullif(coalesce(new.raw_user_meta_data->>'name', ''), '')
  )
  on conflict (id) do update set
    email = case
      when excluded.email <> '' then excluded.email
      else public.profiles.email
    end,
    name = coalesce(excluded.name, public.profiles.name);

  return new;
exception
  when others then
    raise warning 'sync_profile_from_auth failed for user %: %', new.id, sqlerrm;
    return new;
end;
$$;
