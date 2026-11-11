export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  const isConfigured = Boolean(
    url &&
      anonKey &&
      !url.includes("seu-projeto.supabase.co") &&
      anonKey !== "sua-chave-anon-publica"
  );

  return {
    url: isConfigured ? url : "https://placeholder.supabase.co",
    anonKey: isConfigured ? anonKey : "placeholder-anon-key",
    isConfigured,
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv().isConfigured;
}

