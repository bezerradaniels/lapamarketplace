-- Admin panel: helper function, RLS policies, and RPC functions.
-- Only manager@lapamarketplace.com.br can access admin data.
-- NOTE: superseded by 20260529110000 (platform_admins table + controlled-domain e-mail).

-- ─── Helper ──────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT auth.email() = 'manager@lapamarketplace.com.br'
$$;

-- ─── Admin read-all policies ──────────────────────────────────────────────────

CREATE POLICY "admin_select_all_stores" ON public.stores
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "admin_select_all_products" ON public.products
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "admin_select_all_sellers" ON public.seller_catalogs
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "admin_select_all_subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "admin_select_all_orders" ON public.orders
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "admin_select_all_profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "admin_select_all_invoices" ON public.invoices
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "admin_select_all_customers" ON public.customers
  FOR SELECT TO authenticated USING (public.is_admin());

-- ─── Platform stats RPC ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_get_platform_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT jsonb_build_object(
    'total_users',       (SELECT COUNT(*) FROM public.profiles),
    'total_stores',      (SELECT COUNT(*) FROM public.stores WHERE deleted_at IS NULL),
    'total_products',    (SELECT COUNT(*) FROM public.products WHERE deleted_at IS NULL),
    'total_sellers',     (SELECT COUNT(*) FROM public.seller_catalogs),
    'paying_customers',  (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'active'),
    'trial_customers',   (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'trialing'),

    'cities_with_stores', (
      SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY (row_to_json(t)->>'count')::int DESC), '[]'::jsonb)
      FROM (
        SELECT address_city AS city, COUNT(*)::int AS count
        FROM public.stores
        WHERE deleted_at IS NULL AND address_city IS NOT NULL AND address_city <> ''
        GROUP BY address_city
        ORDER BY count DESC
        LIMIT 10
      ) t
    ),

    'states_with_stores', (
      SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY (row_to_json(t)->>'count')::int DESC), '[]'::jsonb)
      FROM (
        SELECT address_state AS state, COUNT(*)::int AS count
        FROM public.stores
        WHERE deleted_at IS NULL AND address_state IS NOT NULL AND address_state <> ''
        GROUP BY address_state
        ORDER BY count DESC
      ) t
    ),

    'sectors_with_stores', (
      SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY (row_to_json(t)->>'count')::int DESC), '[]'::jsonb)
      FROM (
        SELECT category AS sector, COUNT(*)::int AS count
        FROM public.stores
        WHERE deleted_at IS NULL AND category IS NOT NULL AND category <> ''
        GROUP BY category
        ORDER BY count DESC
        LIMIT 10
      ) t
    ),

    'stores_per_month', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
               COUNT(*)::int AS count
        FROM public.stores
        WHERE deleted_at IS NULL
          AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month
      ) t
    ),

    'revenue_per_month', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT to_char(date_trunc('month', paid_at), 'YYYY-MM') AS month,
               SUM(amount_in_cents)::bigint AS amount
        FROM public.invoices
        WHERE status = 'paid'
          AND paid_at IS NOT NULL
          AND paid_at >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- ─── Stores list RPC ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_get_stores_list()
RETURNS TABLE(
  id              uuid,
  name            text,
  slug            text,
  created_at      timestamptz,
  owner_email     text,
  owner_name      text,
  plan_status     text,
  plan_id         text,
  trial_ends_at   timestamptz,
  current_period_end timestamptz,
  last_payment_at timestamptz,
  product_count   bigint,
  seller_count    bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.slug,
    s.created_at,
    p.email                                                         AS owner_email,
    p.name                                                          AS owner_name,
    sub.status::text                                                AS plan_status,
    sub.plan_id::text                                               AS plan_id,
    sub.trial_ends_at,
    sub.current_period_end,
    (SELECT MAX(i.paid_at)
       FROM public.invoices i
      WHERE i.store_id = s.id AND i.status = 'paid')              AS last_payment_at,
    (SELECT COUNT(*)
       FROM public.products pr
      WHERE pr.store_id = s.id AND pr.deleted_at IS NULL)         AS product_count,
    (SELECT COUNT(*)
       FROM public.seller_catalogs sc
      WHERE sc.store_id = s.id)                                    AS seller_count
  FROM public.stores s
  LEFT JOIN public.profiles     p   ON p.id  = s.owner_id
  LEFT JOIN public.subscriptions sub ON sub.store_id = s.id
  WHERE s.deleted_at IS NULL
  ORDER BY s.created_at DESC;
END;
$$;

-- ─── Store detail RPC ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_get_store_detail(p_store_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT jsonb_build_object(
    'store',               to_jsonb(s),
    'owner',               to_jsonb(p),
    'subscription',        to_jsonb(sub),
    'product_count',       (SELECT COUNT(*) FROM public.products   WHERE store_id = p_store_id AND deleted_at IS NULL),
    'active_product_count',(SELECT COUNT(*) FROM public.products   WHERE store_id = p_store_id AND deleted_at IS NULL AND is_active = true),
    'seller_count',        (SELECT COUNT(*) FROM public.seller_catalogs WHERE store_id = p_store_id),
    'order_count',         (SELECT COUNT(*) FROM public.orders     WHERE store_id = p_store_id),
    'checkout_count',      (SELECT COUNT(*) FROM public.orders     WHERE store_id = p_store_id AND source = 'checkout'),
    'total_revenue_cents', (SELECT COALESCE(SUM(total_in_cents), 0) FROM public.orders WHERE store_id = p_store_id AND status = 'confirmed'),
    'customer_count',      (SELECT COUNT(*) FROM public.customers  WHERE store_id = p_store_id),
    'recent_orders', (
      SELECT COALESCE(jsonb_agg(to_jsonb(o) ORDER BY o.created_at DESC), '[]'::jsonb)
      FROM (
        SELECT * FROM public.orders WHERE store_id = p_store_id ORDER BY created_at DESC LIMIT 10
      ) o
    )
  )
  FROM public.stores s
  LEFT JOIN public.profiles      p   ON p.id        = s.owner_id
  LEFT JOIN public.subscriptions sub ON sub.store_id = s.id
  WHERE s.id = p_store_id
  INTO result;

  RETURN result;
END;
$$;
