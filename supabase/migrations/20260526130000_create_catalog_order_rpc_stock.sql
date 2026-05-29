-- Atomic public checkout RPC.
-- Creates the catalog order, validates current product prices, and decrements
-- product or variation stock in one database transaction.

create or replace function public.create_catalog_order(
  p_store_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_notes text default null,
  p_items jsonb default '[]'::jsonb,
  p_coupon_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_now timestamptz := now();
  v_item jsonb;
  v_product public.products%rowtype;
  v_product_id uuid;
  v_quantity integer;
  v_selected_variation text;
  v_price integer;
  v_subtotal integer := 0;
  v_discount integer := 0;
  v_coupon public.store_coupons%rowtype;
  v_coupon_code text := null;
  v_option jsonb;
  v_option_idx integer;
  v_option_stock integer;
  v_new_options jsonb;
  v_order_items jsonb := '[]'::jsonb;
  v_line_categories text[] := array[]::text[];
begin
  if not exists (
    select 1
    from public.stores s
    where s.id = p_store_id
      and s.deleted_at is null
  ) then
    raise exception using errcode = 'check_violation', message = 'store_unavailable';
  end if;

  if p_customer_name is null
    or char_length(btrim(p_customer_name)) < 2
    or char_length(btrim(p_customer_name)) > 120 then
    raise exception using errcode = 'check_violation', message = 'customer_name_invalid';
  end if;

  if p_customer_phone is null or p_customer_phone !~ '^\+55\d{10,11}$' then
    raise exception using errcode = 'check_violation', message = 'customer_phone_invalid';
  end if;

  if p_customer_notes is not null and char_length(p_customer_notes) > 500 then
    raise exception using errcode = 'check_violation', message = 'customer_notes_too_long';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = 'check_violation', message = 'cart_empty';
  end if;

  if jsonb_array_length(p_items) > 100 then
    raise exception using errcode = 'check_violation', message = 'cart_too_large';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := nullif(v_item->>'product_id', '')::uuid;
    v_quantity := coalesce((v_item->>'quantity')::integer, 0);
    v_selected_variation := nullif(btrim(coalesce(v_item->>'selected_variation', '')), '');

    if v_product_id is null or v_quantity <= 0 then
      raise exception using errcode = 'check_violation', message = 'invalid_order_item';
    end if;

    select *
    into v_product
    from public.products p
    where p.id = v_product_id
      and p.store_id = p_store_id
      and p.deleted_at is null
      and p.is_active = true
    for update;

    if not found then
      raise exception using errcode = 'check_violation', message = 'product_unavailable';
    end if;

    v_price := case
      when v_product.promo_price_in_cents is not null
        and v_product.promo_price_in_cents < v_product.price_in_cents
        then v_product.promo_price_in_cents
      else v_product.price_in_cents
    end;

    if v_product.has_variations then
      if v_selected_variation is null then
        raise exception using errcode = 'check_violation', message = 'variation_required';
      end if;

      v_option := null;
      v_option_idx := null;

      select opt.value, opt.ordinality::integer
      into v_option, v_option_idx
      from jsonb_array_elements(coalesce(v_product.variation_options, '[]'::jsonb))
        with ordinality as opt(value, ordinality)
      where opt.value->>'name' = v_selected_variation
      limit 1;

      if v_option is null then
        raise exception using errcode = 'check_violation', message = 'variation_unavailable';
      end if;

      v_option_stock := case
        when jsonb_typeof(v_option->'stock') = 'number'
          then (v_option->>'stock')::integer
        else null
      end;

      if v_option_stock is not null then
        if v_option_stock < v_quantity then
          raise exception using errcode = 'check_violation', message = 'insufficient_stock';
        end if;

        v_new_options := jsonb_set(
          v_product.variation_options,
          array[(v_option_idx - 1)::text, 'stock'],
          to_jsonb(v_option_stock - v_quantity),
          false
        );

        update public.products
        set variation_options = v_new_options
        where id = v_product.id;
      end if;
    else
      if v_product.stock is not null then
        if v_product.stock < v_quantity then
          raise exception using errcode = 'check_violation', message = 'insufficient_stock';
        end if;

        update public.products
        set stock = stock - v_quantity
        where id = v_product.id;
      end if;
    end if;

    v_subtotal := v_subtotal + (v_price * v_quantity);
    if v_product.category is not null then
      v_line_categories := array_append(v_line_categories, v_product.category);
    end if;

    v_order_items := v_order_items || jsonb_build_array(
      jsonb_build_object(
        'id', gen_random_uuid(),
        'order_id', v_order_id,
        'product_id', v_product.id,
        'product_name', v_product.name,
        'price_in_cents', v_price,
        'quantity', v_quantity,
        'selected_variation', v_selected_variation,
        'created_at', v_now
      )
    );
  end loop;

  if p_coupon_id is not null then
    select *
    into v_coupon
    from public.store_coupons c
    where c.id = p_coupon_id
      and c.store_id = p_store_id
      and c.is_active = true
    for update;

    if not found then
      raise exception using errcode = 'check_violation', message = 'coupon_not_found';
    end if;

    if v_coupon.expires_at is not null and v_coupon.expires_at < now() then
      raise exception using errcode = 'check_violation', message = 'coupon_expired';
    end if;

    if v_coupon.max_uses is not null and v_coupon.used_count >= v_coupon.max_uses then
      raise exception using errcode = 'check_violation', message = 'coupon_max_uses_reached';
    end if;

    if v_subtotal < v_coupon.min_subtotal_in_cents then
      raise exception using errcode = 'check_violation', message = 'coupon_min_subtotal_not_reached';
    end if;

    if v_coupon.category_id is not null and not exists (
      with recursive eligible_categories as (
        select c.id, c.name
        from public.categories c
        where c.id = v_coupon.category_id
          and c.store_id = p_store_id
          and c.deleted_at is null

        union all

        select child.id, child.name
        from public.categories child
        join eligible_categories parent on child.parent_id = parent.id
        where child.store_id = p_store_id
          and child.deleted_at is null
      )
      select 1
      from eligible_categories ec
      where ec.name = any(v_line_categories)
    ) then
      raise exception using errcode = 'check_violation', message = 'coupon_category_not_eligible';
    end if;

    v_discount := case
      when v_coupon.discount_type = 'percent'
        then floor((v_subtotal * v_coupon.discount_value) / 100.0)::integer
      else least(v_coupon.discount_value, v_subtotal)
    end;
    v_coupon_code := v_coupon.code;

    update public.store_coupons
    set used_count = used_count + 1
    where id = v_coupon.id;
  end if;

  insert into public.orders (
    id,
    store_id,
    status,
    source,
    seller_id,
    customer_name,
    customer_phone,
    customer_notes,
    total_in_cents,
    discount_in_cents,
    coupon_id,
    coupon_code,
    created_at,
    updated_at
  )
  values (
    v_order_id,
    p_store_id,
    'pending',
    'catalog',
    null,
    btrim(p_customer_name),
    p_customer_phone,
    nullif(btrim(coalesce(p_customer_notes, '')), ''),
    greatest(0, v_subtotal - v_discount),
    v_discount,
    p_coupon_id,
    v_coupon_code,
    v_now,
    v_now
  );

  insert into public.order_items (
    id,
    order_id,
    product_id,
    product_name,
    price_in_cents,
    quantity,
    selected_variation,
    created_at
  )
  select
    (item->>'id')::uuid,
    (item->>'order_id')::uuid,
    (item->>'product_id')::uuid,
    item->>'product_name',
    (item->>'price_in_cents')::integer,
    (item->>'quantity')::integer,
    nullif(item->>'selected_variation', ''),
    (item->>'created_at')::timestamptz
  from jsonb_array_elements(v_order_items) as item;

  return jsonb_build_object(
    'id', v_order_id,
    'store_id', p_store_id,
    'status', 'pending',
    'source', 'catalog',
    'seller_id', null,
    'customer_name', btrim(p_customer_name),
    'customer_phone', p_customer_phone,
    'customer_notes', nullif(btrim(coalesce(p_customer_notes, '')), ''),
    'total_in_cents', greatest(0, v_subtotal - v_discount),
    'discount_in_cents', v_discount,
    'coupon_id', p_coupon_id,
    'coupon_code', v_coupon_code,
    'created_at', v_now,
    'updated_at', v_now,
    'items', v_order_items
  );
end;
$$;

revoke all on function public.create_catalog_order(uuid, text, text, text, jsonb, uuid) from public;
grant execute on function public.create_catalog_order(uuid, text, text, text, jsonb, uuid)
  to anon, authenticated;
