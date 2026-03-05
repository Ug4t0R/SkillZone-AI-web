/**
 * API Proxy Client
 * 
 * Routes API calls through Supabase Edge Functions to keep API keys server-side.
 * Falls back to direct calls if VITE_SUPABASE_FUNCTIONS_URL is not set.
 */

import { getSupabase } from './supabaseClient';

/**
 * Get the base URL for Supabase Edge Functions.
 * Derives from the Supabase client URL.
 */
function getEdgeFunctionsUrl(): string {
    // The Supabase URL is like: https://xxxx.supabase.co
    // Edge Functions are at:   https://xxxx.supabase.co/functions/v1/
    const sb = getSupabase();
    // @ts-ignore - accessing protected property for URL
    const supabaseUrl = (sb as any).supabaseUrl || localStorage.getItem('sz_supabase_url') || 'https://snqmuyieibahlluqafbo.supabase.co';
    return `${supabaseUrl}/functions/v1`;
}

/**
 * Get the anon key for auth header
 */
function getAnonKey(): string {
    return localStorage.getItem('sz_supabase_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucW11eWllaWJhaGxsdXFhZmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDQ1NTgsImV4cCI6MjA4MDk4MDU1OH0.058WiFkALb3phaqpz6ls9pD0AUQ8QoiBBAelRMj35JY';
}

/**
 * Call a Google Places/Routes/Geocoding API endpoint through the proxy.
 */
export async function callPlacesProxy(
    endpoint: string,
    options: {
        method?: 'GET' | 'POST';
        body?: any;
        fieldMask?: string;
    } = {}
): Promise<any> {
    const baseUrl = getEdgeFunctionsUrl();

    const response = await fetch(`${baseUrl}/places-proxy`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAnonKey()}`,
        },
        body: JSON.stringify({
            endpoint,
            method: options.method || 'POST',
            body: options.body,
            fieldMask: options.fieldMask,
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Places proxy error (${response.status}): ${errText}`);
    }

    return response.json();
}

/**
 * Call SerpAPI through the proxy.
 */
export async function callSerpApiProxy(
    params: Record<string, string>
): Promise<any> {
    const baseUrl = getEdgeFunctionsUrl();

    const response = await fetch(`${baseUrl}/serpapi-proxy`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAnonKey()}`,
        },
        body: JSON.stringify({ params }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`SerpAPI proxy error (${response.status}): ${errText}`);
    }

    return response.json();
}
