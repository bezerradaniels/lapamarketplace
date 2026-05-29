export const ADMIN_EMAILS = ['lapamarketplace@gmail.com'] as const

export const PRIMARY_ADMIN_EMAIL = ADMIN_EMAILS[0]

export function isAdminEmail(email: string | null | undefined) {
  return ADMIN_EMAILS.includes((email ?? '').toLowerCase() as (typeof ADMIN_EMAILS)[number])
}
