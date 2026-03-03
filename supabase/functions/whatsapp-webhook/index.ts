/**
 * WhatsApp Business Cloud API → Supabase Webhook
 * 
 * Handles:
 * 1. GET  → Meta webhook verification (hub.challenge handshake)
 * 2. POST → Incoming messages → stored in web_whatsapp_conversations + web_whatsapp_messages
 * 3. POST → Status updates (sent/delivered/read) → updates message status
 * 
 * Deploy: npx supabase functions deploy whatsapp-webhook --no-verify-jwt
 * 
 * Required secrets:
 *   WHATSAPP_VERIFY_TOKEN  — arbitrary string matching Meta dashboard config
 *   WHATSAPP_TOKEN         — permanent System User token from Meta Business
 *   SUPABASE_URL           — https://snqmuyieibahlluqafbo.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY — service_role key (bypasses RLS)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Helpers ────────────────────────────────────────────────
const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });

const text = (body: string, status = 200) =>
    new Response(body, { status, headers: { 'Content-Type': 'text/plain' } });

function getSupabase() {
    const url = Deno.env.get('SUPABASE_URL')!;
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    return createClient(url, key);
}

// ─── Types ──────────────────────────────────────────────────
interface WaMessage {
    id: string;
    from: string;
    timestamp: string;
    type: string;
    text?: { body: string };
    image?: { caption?: string; id: string };
    // More types can be added as needed
}

interface WaContact {
    profile: { name: string };
    wa_id: string;
}

interface WaStatusUpdate {
    id: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
    recipient_id: string;
}

// ─── Main Handler ───────────────────────────────────────────
Deno.serve(async (req: Request) => {
    try {
        // ── GET: Webhook verification ───────────────────────
        if (req.method === 'GET') {
            const url = new URL(req.url);
            const mode = url.searchParams.get('hub.mode');
            const token = url.searchParams.get('hub.verify_token');
            const challenge = url.searchParams.get('hub.challenge');

            const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN');

            if (mode === 'subscribe' && token === verifyToken) {
                console.log('[WhatsApp] Webhook verified ✓');
                return text(challenge || '', 200);
            }

            console.warn('[WhatsApp] Verification failed — token mismatch');
            return text('Forbidden', 403);
        }

        // ── POST: Incoming webhook events ───────────────────
        if (req.method === 'POST') {
            const body = await req.json();

            // Meta always wraps in { object, entry[] }
            if (body.object !== 'whatsapp_business_account') {
                return json({ status: 'ignored' }, 200);
            }

            const sb = getSupabase();

            for (const entry of body.entry || []) {
                for (const change of entry.changes || []) {
                    const value = change.value;
                    if (!value) continue;

                    // ── Handle incoming messages ────────────
                    if (value.messages && value.messages.length > 0) {
                        const contacts: WaContact[] = value.contacts || [];

                        for (const msg of value.messages as WaMessage[]) {
                            const senderPhone = msg.from;
                            const senderName = contacts.find(
                                (c) => c.wa_id === senderPhone
                            )?.profile?.name || null;

                            // Extract message body based on type
                            let messageBody = '';
                            switch (msg.type) {
                                case 'text':
                                    messageBody = msg.text?.body || '';
                                    break;
                                case 'image':
                                    messageBody = msg.image?.caption
                                        ? `📷 ${msg.image.caption}`
                                        : '📷 Obrázek';
                                    break;
                                case 'video':
                                    messageBody = '🎬 Video';
                                    break;
                                case 'audio':
                                    messageBody = '🎵 Hlasová zpráva';
                                    break;
                                case 'document':
                                    messageBody = '📎 Dokument';
                                    break;
                                case 'sticker':
                                    messageBody = '🏷️ Sticker';
                                    break;
                                case 'location':
                                    messageBody = '📍 Poloha';
                                    break;
                                case 'contacts':
                                    messageBody = '👤 Kontakt';
                                    break;
                                case 'reaction':
                                    // Skip reactions, they don't need to be stored as messages
                                    continue;
                                default:
                                    messageBody = `[${msg.type}]`;
                            }

                            const msgTimestamp = new Date(
                                parseInt(msg.timestamp) * 1000
                            ).toISOString();

                            // ── Upsert conversation ─────────
                            const { data: convo } = await sb
                                .from('web_whatsapp_conversations')
                                .upsert(
                                    {
                                        id: senderPhone,
                                        phone: senderPhone,
                                        name: senderName,
                                        last_message: messageBody.slice(0, 200),
                                        last_message_at: msgTimestamp,
                                        unread_count: 1, // Will be incremented below
                                    },
                                    { onConflict: 'id' }
                                )
                                .select('unread_count')
                                .single();

                            // Increment unread count
                            if (convo) {
                                await sb
                                    .from('web_whatsapp_conversations')
                                    .update({
                                        unread_count: (convo.unread_count || 0) + 1,
                                        last_message: messageBody.slice(0, 200),
                                        last_message_at: msgTimestamp,
                                        name: senderName || undefined,
                                    })
                                    .eq('id', senderPhone);
                            }

                            // ── Insert message ──────────────
                            await sb
                                .from('web_whatsapp_messages')
                                .upsert(
                                    {
                                        id: msg.id,
                                        conversation_id: senderPhone,
                                        direction: 'incoming',
                                        body: messageBody,
                                        created_at: msgTimestamp,
                                        status: 'delivered',
                                    },
                                    { onConflict: 'id' }
                                );

                            console.log(
                                `[WhatsApp] 📩 ${senderName || senderPhone}: ${messageBody.slice(0, 50)}`
                            );
                        }
                    }

                    // ── Handle status updates ───────────────
                    if (value.statuses && value.statuses.length > 0) {
                        for (const status of value.statuses as WaStatusUpdate[]) {
                            await sb
                                .from('web_whatsapp_messages')
                                .update({ status: status.status })
                                .eq('id', status.id);

                            console.log(
                                `[WhatsApp] Status: ${status.id} → ${status.status}`
                            );
                        }
                    }
                }
            }

            // Meta requires 200 response within 5s or it retries
            return json({ status: 'ok' }, 200);
        }

        return text('Method not allowed', 405);
    } catch (err) {
        console.error('[WhatsApp] Webhook error:', err);
        // Still return 200 to prevent Meta from retrying on our errors
        return json({ status: 'error', message: String(err) }, 200);
    }
});
