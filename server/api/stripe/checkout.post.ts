import Stripe from 'stripe'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const courseId = body?.courseId as string
  if (!courseId) {
    throw createError({ statusCode: 400, message: 'courseId required' })
  }
  const userId = event.context.auth?.userId ?? null
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Login required' })
  }
  const config = useRuntimeConfig()
  const secret = config.stripeSecretKey as string
  if (!secret) {
    throw createError({ statusCode: 500, message: 'Stripe not configured' })
  }
  const stripe = new Stripe(secret)
  const { serverSupabaseService } = await import('../../utils/supabaseServer')
  const supabase = serverSupabaseService()
  const { data: course, error: courseError } = await supabase.from('courses').select('id, title, is_free, price').eq('id', courseId).single()
  if (courseError || !course || course.is_free) {
    throw createError({ statusCode: 400, message: 'Invalid or free course' })
  }
  const price = Number(course.price) || 0
  if (price <= 0) {
    throw createError({ statusCode: 400, message: 'Course has no price' })
  }
  const origin = getRequestURL(event).origin
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price_data: { currency: 'eur', unit_amount: price, product_data: { name: course.title } }, quantity: 1 }],
    success_url: `${origin}/course/${courseId}?success=1`,
    cancel_url: `${origin}/course/${courseId}?cancel=1`,
    client_reference_id: userId,
    metadata: { courseId, userId },
  })
  return { url: session.url }
})
