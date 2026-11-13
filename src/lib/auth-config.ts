/**
 * Login com Google (OAuth) desligado temporariamente: a troca do código com o
 * Google está falhando no Supabase ("Unable to exchange external code").
 * Para religar, revise Client ID/Secret do provedor Google no Supabase e os
 * redirecionamentos no Google Cloud, depois mude para `true`.
 * Esconde o botão em login, cadastro e no aviso de favoritos, e o servidor
 * recusa `loginWithGoogle` enquanto estiver `false`.
 */
export const GOOGLE_AUTH_ENABLED = false;
