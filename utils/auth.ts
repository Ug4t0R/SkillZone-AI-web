/**
 * Shared security constants
 * SECURITY: Keep admin authorization server-side via Supabase RLS.
 * This constant is used for client-side UX gating only — real authorization
 * is enforced by RLS policies on the Supabase database.
 */

/** Authorized admin emails — must match Supabase RLS policies */
export const AUTHORIZED_ADMIN_EMAILS = [
    'tomas@skillzone.cz',
    'petr@skillzone.cz',
] as const;

/** @deprecated Use AUTHORIZED_ADMIN_EMAILS instead */
export const AUTHORIZED_ADMIN_EMAIL = AUTHORIZED_ADMIN_EMAILS[0];

/** Check if an email is authorized for admin/dev menu access */
export function isAuthorizedAdmin(email: string | undefined | null): boolean {
    if (!email) return false;
    return AUTHORIZED_ADMIN_EMAILS.includes(email.toLowerCase() as any);
}
