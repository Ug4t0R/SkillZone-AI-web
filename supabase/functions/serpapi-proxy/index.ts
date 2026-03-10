import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY") || "";

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

    if (!SERPAPI_KEY) {
        return new Response(JSON.stringify({ error: "SERPAPI_KEY not configured" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    try {
        const body = await req.json();
        const { params } = body;

        if (!params || !params.engine) {
            return new Response(JSON.stringify({ error: "Missing engine parameter" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Only allow whitelisted engines
        const ALLOWED_ENGINES = ['google_maps_reviews', 'google', 'google_maps', 'bing', 'yandex'];
        if (!ALLOWED_ENGINES.includes(params.engine)) {
            return new Response(JSON.stringify({ error: `Engine "${params.engine}" not allowed` }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Build SerpAPI URL with API key injected server-side
        const searchParams = new URLSearchParams({
            ...params,
            api_key: SERPAPI_KEY,
        });

        const response = await fetch(`https://serpapi.com/search.json?${searchParams.toString()}`);
        const data = await response.text();

        return new Response(data, {
            status: response.status,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
            },
        });
    } catch (err) {
        console.error("[serpapi-proxy] Error:", err);
        return new Response(JSON.stringify({ error: "Proxy error", details: String(err) }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
