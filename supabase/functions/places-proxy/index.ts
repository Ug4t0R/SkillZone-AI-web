import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_PLACES_KEY = Deno.env.get("GOOGLE_PLACES_KEY") || "";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
    // CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (!GOOGLE_PLACES_KEY) {
        return new Response(JSON.stringify({ error: "GOOGLE_PLACES_KEY not configured" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    try {
        const body = await req.json();
        const { endpoint, method, body: requestBody, fieldMask } = body;

        // Whitelist allowed Google API endpoints
        const allowedPrefixes = [
            "https://places.googleapis.com/",
            "https://routes.googleapis.com/",
            "https://maps.googleapis.com/maps/api/geocode/",
        ];

        if (!endpoint || !allowedPrefixes.some((p) => endpoint.startsWith(p))) {
            return new Response(JSON.stringify({ error: "Endpoint not allowed" }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Build headers with API key injected server-side
        const proxyHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_PLACES_KEY,
        };
        if (fieldMask) {
            proxyHeaders["X-Goog-FieldMask"] = fieldMask;
        }

        // For GET requests (geocoding uses query params in URL)
        const fetchMethod = method || "POST";
        const fetchOptions: RequestInit = {
            method: fetchMethod,
            headers: proxyHeaders,
        };

        if (fetchMethod === "POST" && requestBody) {
            fetchOptions.body = JSON.stringify(requestBody);
        }

        // Add API key as query param for GET requests (geocoding)
        let finalEndpoint = endpoint;
        if (fetchMethod === "GET") {
            const separator = endpoint.includes("?") ? "&" : "?";
            finalEndpoint = `${endpoint}${separator}key=${GOOGLE_PLACES_KEY}`;
        }

        const response = await fetch(finalEndpoint, fetchOptions);
        const data = await response.text();

        return new Response(data, {
            status: response.status,
            headers: {
                ...corsHeaders,
                "Content-Type": response.headers.get("Content-Type") || "application/json",
            },
        });
    } catch (err) {
        console.error("[places-proxy] Error:", err);
        return new Response(JSON.stringify({ error: "Proxy error", details: String(err) }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
