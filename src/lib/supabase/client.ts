import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  // Check if env vars are present, if not return a dummy client or throw a clearer error
  // During build time, env vars might be missing if not set in Vercel settings correctly
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // If we are in browser, this is critical. If during build (node), maybe we can tolerate?
    // But createBrowserClient is for client side.
    if (typeof window !== 'undefined') {
        console.error("Supabase Env Vars missing!")
    }
    // Fallback to a syntactically valid URL to prevent crash during static generation
    // This allows 'npm run build' to succeed even without env vars
    return createBrowserClient('https://placeholder.supabase.co', 'placeholder-key')
  }

  return createBrowserClient(url, key)
}
