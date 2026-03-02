-- Vytvoření tabulky rental_inquiries pro správu soukromých pronájmů
CREATE TABLE IF NOT EXISTS public.rental_inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    people_count INTEGER NOT NULL,
    is_large_group BOOLEAN DEFAULT false,
    branch TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TEXT NOT NULL,
    duration_hours INTEGER NOT NULL,
    games TEXT[] DEFAULT '{}',
    games_later BOOLEAN DEFAULT false,
    addons JSONB DEFAULT '{"beer": false, "animator": false, "technician": false}'::jsonb,
    is_company BOOLEAN DEFAULT false,
    company_name TEXT,
    ico TEXT,
    phone TEXT NOT NULL,
    whatsapp BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'communicating', 'approved', 'rejected')),
    price_quote TEXT,
    internal_notes TEXT
);

-- Nastavení RLS (Row Level Security)
ALTER TABLE public.rental_inquiries ENABLE ROW LEVEL SECURITY;

-- Povolit insert komukoliv (anonymním uživatelům z webu)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'rental_inquiries'
          AND policyname = 'Allow anonymous inserts'
    ) THEN
        CREATE POLICY "Allow anonymous inserts" ON public.rental_inquiries
            FOR INSERT
            TO anon, authenticated
            WITH CHECK (true);
    END IF;
END
$$;

-- Povolit čtení a úpravy pouze přihlášeným uživatelům (adminům)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'rental_inquiries'
          AND policyname = 'Allow authenticated full access'
    ) THEN
        CREATE POLICY "Allow authenticated full access" ON public.rental_inquiries
            FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;
END
$$;

-- Konec
NOTIFY pgrst, 'reload schema';
