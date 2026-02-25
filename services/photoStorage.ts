/**
 * Photo Storage — upload, delete, and retrieve photos from Supabase Storage.
 * Falls back gracefully when storage bucket is not configured.
 */
import { getSupabase } from './supabaseClient';

const BUCKET = 'photos';

// ─── Upload ──────────────────────────────────────────────────────────

export async function uploadPhoto(
    file: File,
    folder: string = 'gallery'
): Promise<{ url: string; path: string } | null> {
    try {
        const sb = getSupabase();
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const safeName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { data, error } = await sb.storage
            .from(BUCKET)
            .upload(safeName, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type,
            });

        if (error) {
            console.error('[photoStorage] Upload failed:', error.message);
            return null;
        }

        const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(data.path);
        return { url: urlData.publicUrl, path: data.path };
    } catch (err) {
        console.error('[photoStorage] Upload error:', err);
        return null;
    }
}

// ─── Delete ──────────────────────────────────────────────────────────

export async function deletePhoto(storagePath: string): Promise<boolean> {
    try {
        const sb = getSupabase();
        const { error } = await sb.storage.from(BUCKET).remove([storagePath]);
        if (error) {
            console.error('[photoStorage] Delete failed:', error.message);
            return false;
        }
        return true;
    } catch (err) {
        console.error('[photoStorage] Delete error:', err);
        return false;
    }
}

// ─── Public URL ──────────────────────────────────────────────────────

export function getPublicUrl(storagePath: string): string {
    const sb = getSupabase();
    const { data } = sb.storage.from(BUCKET).getPublicUrl(storagePath);
    return data.publicUrl;
}

// ─── Check if bucket exists ──────────────────────────────────────────

export async function checkStorageBucket(): Promise<boolean> {
    try {
        const sb = getSupabase();
        const { data, error } = await sb.storage.listBuckets();
        if (error) return false;
        return data?.some(b => b.name === BUCKET) ?? false;
    } catch {
        return false;
    }
}

// ─── Create bucket (if admin) ────────────────────────────────────────

export async function createStorageBucket(): Promise<boolean> {
    try {
        const sb = getSupabase();
        const { error } = await sb.storage.createBucket(BUCKET, {
            public: true,
            fileSizeLimit: 10 * 1024 * 1024, // 10MB
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        });
        if (error) {
            console.error('[photoStorage] Bucket creation failed:', error.message);
            return false;
        }
        return true;
    } catch (err) {
        console.error('[photoStorage] Bucket creation error:', err);
        return false;
    }
}

// ─── Convert File to base64 data URL (fallback when no bucket) ───────

export function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
