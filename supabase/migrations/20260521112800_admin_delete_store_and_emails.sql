CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT lower(coalesce(auth.email(), '')) = 'manager@lapamarketplace.com.br'
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_store(p_store_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  DELETE FROM public.stores
  WHERE id = p_store_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loja não encontrada';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_store(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_store(uuid) TO authenticated;
