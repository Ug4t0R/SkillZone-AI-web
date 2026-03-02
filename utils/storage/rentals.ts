import { getSupabase } from '../../services/supabaseClient';

export interface RentalInquiry {
    id: string;
    created_at: string;
    name: string;
    people_count: number;
    is_large_group: boolean;
    branch: string;
    date: string;
    start_time: string;
    duration_hours: number;
    games: string[];
    games_later: boolean;
    addons: {
        beer: boolean;
        beer_kegs?: {
            size: '15l' | '30l' | '50l';
            brand: string;
        }[];
        animator: boolean;
        technician: boolean;
        invoice: boolean;
    };
    is_company: boolean;
    company_name?: string;
    ico?: string;
    dic?: string;
    company_address?: string;
    invoice_email?: string;
    phone: string;
    whatsapp: boolean;
    status: 'new' | 'communicating' | 'approved' | 'rejected';
    price_quote?: string;
    internal_notes?: string;
}

/**
 * Submit a new rental inquiry
 */
export async function submitRentalInquiry(inquiry: Omit<RentalInquiry, 'id' | 'created_at' | 'status'>): Promise<boolean> {
    try {
        const supabase = getSupabase();
        const { error } = await supabase
            .from('rental_inquiries')
            .insert([{
                ...inquiry,
                status: 'new'
            }]);

        if (error) {
            console.error('Error submitting rental inquiry:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Exception in submitRentalInquiry:', err);
        return false;
    }
}

/**
 * Fetch rental inquiries by phone (secure client RPC)
 */
export async function getInquiriesByPhone(phone: string): Promise<RentalInquiry[]> {
    try {
        const supabase = getSupabase();
        // Uses the RPC defined in 20260228_rental_inquiries_rpc.sql
        const { data, error } = await supabase.rpc('get_inquiry_by_phone', { p_phone: phone });

        if (error) {
            console.error('Error fetching inquiries by phone:', error);
            return [];
        }

        return data as RentalInquiry[];
    } catch (err) {
        console.error('Exception in getInquiriesByPhone:', err);
        return [];
    }
}

/**
 * Fetch all rental inquiries for admin
 */
export async function getRentalInquiries(): Promise<RentalInquiry[]> {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('rental_inquiries')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching rental inquiries:', error);
            return [];
        }

        return data as RentalInquiry[];
    } catch (err) {
        console.error('Exception in getRentalInquiries:', err);
        return [];
    }
}

/**
 * Update inquiry status or price quote
 */
export async function updateRentalInquiry(id: string, updates: Partial<RentalInquiry>): Promise<boolean> {
    try {
        const supabase = getSupabase();
        const { error } = await supabase
            .from('rental_inquiries')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error updating inquiry:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Exception updating inquiry:', err);
        return false;
    }
}
