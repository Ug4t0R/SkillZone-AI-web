/**
 * Shared security constants
 * SECURITY: Keep admin authorization server-side via Supabase RLS.
 * This constant is used for client-side UX gating only — real authorization
 * is enforced by RLS policies on the Supabase database.
 */

/** The single authorized admin email — must match Supabase RLS policies */
export const AUTHORIZED_ADMIN_EMAIL = 'tomas@skillzone.cz';
