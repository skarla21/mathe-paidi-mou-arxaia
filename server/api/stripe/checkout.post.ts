import Stripe from 'stripe'
import { requireAuth } from '../../utils/requireAuth'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const body = await readBody(event).catch(() => ({}))
  const lessonId = body?.lessonId as string
  if (!lessonId) {
    throw createError({ statusCode: 400, message: 'lessonId required' })
  }
  const config = useRuntimeConfig()
  const secret = config.stripeSecretKey as string
  if (!secret) {
    throw createError({ statusCode: 500, message: 'Stripe not configured' })
  }
  const stripe = new Stripe(secret)
  const { serverSupabaseService } = await import('../../utils/supabaseServer')
  const supabase = serverSupabaseService()
  const { data: lesson, error: lessonError } = await supabase.from('lessons').select('id, title, is_free, price').eq('id', lessonId).single()
  if (lessonError || !lesson || lesson.is_free) {
    throw createError({ statusCode: 400, message: 'Invalid or free lesson' })
  }
  const price = Number(lesson.price) || 0
  if (price <= 0) {
    throw createError({ statusCode: 400, message: 'Lesson has no price' })
  }
  const origin = getRequestURL(event).origin
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price_data: { currency: 'eur', unit_amount: price, product_data: { name: lesson.title } }, quantity: 1 }],
    success_url: `${origin}/lesson/${lessonId}?success=1`,
    cancel_url: `${origin}/lesson/${lessonId}?cancel=1`,
    client_reference_id: userId,
    metadata: { lessonId, userId },
  })
  return { url: session.url }
})
