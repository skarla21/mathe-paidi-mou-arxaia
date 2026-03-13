import Stripe from 'stripe'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const secret = config.stripeWebhookSecret as string
  if (!secret) {
    throw createError({ statusCode: 500, message: 'Webhook secret not configured' })
  }
  const body = await readRawBody(event)
  const sig = getHeader(event, 'stripe-signature')
  if (!body || !sig) {
    throw createError({ statusCode: 400, message: 'Missing body or signature' })
  }
  const stripe = new Stripe(config.stripeSecretKey as string)
  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err: any) {
    throw createError({ statusCode: 400, message: err.message })
  }
  if (stripeEvent.type !== 'checkout.session.completed') {
    return { received: true }
  }
  const session = stripeEvent.data.object as Stripe.Checkout.Session
  if (session.mode !== 'payment') return { received: true }
  const userId = session.metadata?.userId ?? session.client_reference_id
  const courseId = session.metadata?.courseId
  if (!userId || !courseId) {
    throw createError({ statusCode: 400, message: 'Missing metadata' })
  }
  const { serverSupabaseService } = await import('../../utils/supabaseServer')
  const supabase = serverSupabaseService()
  const { data: existing } = await supabase.from('purchases').select('id').eq('stripe_session_id', session.id).single()
  if (existing) {
    return { received: true }
  }
  await supabase.from('purchases').insert({
    user_id: userId,
    course_id: courseId,
    stripe_session_id: session.id,
  })
  return { received: true }
})
