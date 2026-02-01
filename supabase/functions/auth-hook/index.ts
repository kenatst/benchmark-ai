import React from 'https://esm.sh/react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'https://esm.sh/resend@4.0.0'
import { renderAsync } from 'https://esm.sh/@react-email/components@0.0.22'
import { MagicLinkEmail } from './_templates/magic-link.tsx'
import { ConfirmEmail } from './_templates/confirm-email.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('AUTH_HOOK_SECRET') as string

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  const wh = new Webhook(hookSecret)
  
  try {
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: {
        email: string
        user_metadata?: {
          full_name?: string
        }
      }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
        site_url: string
        token_new: string
        token_hash_new: string
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const siteUrl = 'https://id-preview--d281c140-859f-42d4-bcb1-1a3462e3cb0f.lovable.app'
    const userName = user.user_metadata?.full_name || ''
    
    let html: string
    let subject: string

    // Determine which template to use based on email_action_type
    if (email_action_type === 'magiclink') {
      html = await renderAsync(
        React.createElement(MagicLinkEmail, {
          supabase_url: supabaseUrl,
          token,
          token_hash,
          redirect_to: redirect_to || `${siteUrl}/app`,
          email_action_type,
          userName,
        })
      )
      subject = 'Votre lien de connexion BenchmarkAI 🔗'
    } else if (email_action_type === 'signup' || email_action_type === 'email_confirmation') {
      html = await renderAsync(
        React.createElement(ConfirmEmail, {
          supabase_url: supabaseUrl,
          token,
          token_hash,
          redirect_to: redirect_to || `${siteUrl}/app`,
          email_action_type: 'signup',
          userName,
        })
      )
      subject = 'Confirmez votre inscription BenchmarkAI ✅'
    } else if (email_action_type === 'recovery') {
      html = await renderAsync(
        React.createElement(MagicLinkEmail, {
          supabase_url: supabaseUrl,
          token,
          token_hash,
          redirect_to: redirect_to || `${siteUrl}/app`,
          email_action_type,
          userName,
          isRecovery: true,
        })
      )
      subject = 'Réinitialisez votre mot de passe BenchmarkAI 🔐'
    } else {
      // Default template
      html = await renderAsync(
        React.createElement(ConfirmEmail, {
          supabase_url: supabaseUrl,
          token,
          token_hash,
          redirect_to: redirect_to || `${siteUrl}/app`,
          email_action_type,
          userName,
        })
      )
      subject = 'BenchmarkAI - Action requise'
    }

    const { error } = await resend.emails.send({
      from: 'BenchmarkAI <noreply@benchmarkai.app>',
      to: [user.email],
      subject,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    console.log(`Auth email sent successfully: ${email_action_type} to ${user.email}`)

  } catch (error) {
    console.error('Auth hook error:', error)
    return new Response(
      JSON.stringify({
        error: {
          http_code: 500,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
