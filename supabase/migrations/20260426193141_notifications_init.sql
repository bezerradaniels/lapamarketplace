-- In-app notifications. Members of a store read them; only triggers and Edge
-- Functions write them (RLS denies INSERT for the browser).

do $$ begin
  create type public.notification_type as enum (
    'order_new',
    'payment_failed',
    'low_stock',
    'seller_added',
    'subscription_event'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  type        public.notification_type not null,
  title       text not null,
  body        text,
  link        text,
  data        jsonb not null default '{}'::jsonb,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_store_unread_idx
  on public.notifications (store_id, created_at desc) where read_at is null;
create index if not exists notifications_store_recent_idx
  on public.notifications (store_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists notifications_member_select on public.notifications;
create policy notifications_member_select on public.notifications
  for select to authenticated using (
    public.is_store_member(store_id)
    and (user_id is null or user_id = auth.uid())
  );

drop policy if exists notifications_member_update on public.notifications;
create policy notifications_member_update on public.notifications
  for update to authenticated using (
    public.is_store_member(store_id)
    and (user_id is null or user_id = auth.uid())
  ) with check (
    public.is_store_member(store_id)
    and (user_id is null or user_id = auth.uid())
  );

create or replace function public.notify_new_order()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  formatted_amount text;
begin
  formatted_amount := 'R$ ' || replace(
    to_char(new.total_in_cents::numeric / 100, 'FM999G999G990D00'),
    ',', 'X'
  );
  formatted_amount := replace(formatted_amount, '.', ',');
  formatted_amount := replace(formatted_amount, 'X', '.');

  insert into public.notifications (store_id, type, title, body, link, data)
  values (
    new.store_id,
    'order_new',
    'Novo pedido',
    new.customer_name || ' · ' || formatted_amount,
    '/dashboard/pedidos',
    jsonb_build_object(
      'order_id', new.id,
      'amount_in_cents', new.total_in_cents,
      'customer_name', new.customer_name
    )
  );
  return new;
end $$;

drop trigger if exists orders_notify_new on public.orders;
create trigger orders_notify_new
  after insert on public.orders
  for each row execute function public.notify_new_order();

alter publication supabase_realtime add table public.notifications;
