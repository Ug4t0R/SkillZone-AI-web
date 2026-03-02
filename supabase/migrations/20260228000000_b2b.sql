-- Přidání sloupců pro firemní údaje k fakturaci
ALTER TABLE public.rental_inquiries 
ADD COLUMN IF NOT EXISTS dic TEXT,
ADD COLUMN IF NOT EXISTS company_address TEXT,
ADD COLUMN IF NOT EXISTS invoice_email TEXT;
