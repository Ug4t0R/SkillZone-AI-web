-- Přidání RPC (Remote Procedure Call) funkce pro bezpečné vyhledání rezervace podle telefonu
-- Funkce běží pod právy vlastníka (SECURITY DEFINER), takže obejde RLS pro čtení,
-- ale vrátí striktně jen ty záznamy, které odpovídají zadanému telefonnímu číslu.

CREATE OR REPLACE FUNCTION get_inquiry_by_phone(p_phone TEXT)
RETURNS SETOF public.rental_inquiries
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.rental_inquiries
  WHERE phone = p_phone
  ORDER BY created_at DESC;
END;
$$;
