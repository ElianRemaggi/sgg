import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      const user = data.session.user
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({
          supabaseUid: user.id,
          email: user.email,
          fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
          avatarUrl: user.user_metadata?.avatar_url || null,
          provider: user.app_metadata?.provider || 'google',
          providerUid: user.user_metadata?.provider_id || user.id,
        }),
      })

      return NextResponse.redirect(`${origin}/select-gym`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
