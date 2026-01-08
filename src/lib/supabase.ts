import { createClient as createClientOriginal } from '@/lib/supabase/client'

// Re-exporting the client for backward compatibility
export const supabase = createClientOriginal()
