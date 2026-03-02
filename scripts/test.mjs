const url = "https://snqmuyieibahlluqafbo.supabase.co/rest/v1/web_settings?select=*";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucW11eWllaWJhaGxsdXFhZmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDQ1NTgsImV4cCI6MjA4MDk4MDU1OH0.058WiFkALb3phaqpz6ls9pD0AUQ8QoiBBAelRMj35JY";

async function test() {
    const res = await fetch(url, {
        headers: {
            apikey: key,
            Authorization: `Bearer ${key}`
        }
    });
    const text = await res.text();
    console.log("READ:", res.status, text);

    const writeUrl = "https://snqmuyieibahlluqafbo.supabase.co/rest/v1/web_settings";
    const wRes = await fetch(writeUrl, {
        method: "POST",
        headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates"
        },
        body: JSON.stringify({ key: "test_key", value: { test: true } })
    });
    const wText = await wRes.text();
    console.log("WRITE:", wRes.status, wText);
}

test();
