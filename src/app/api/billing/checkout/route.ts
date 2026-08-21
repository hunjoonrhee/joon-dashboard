import { getAuthenticatedUserId } from '@/lib/api-auth';
import { getProPriceId, getStripeClient } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { locale } = await req.json();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const stripe = getStripeClient();

  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: existing } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle();

  let customerId = existing?.stripe_customer_id as string | undefined;

  if (!customerId) {
    const {
      data: { user },
    } = await supabaseAdmin.auth.admin.getUserById(userId);
    const customer = await stripe.customers.create({
      email: user?.email,
      metadata: { supabase_user_id: userId },
    });
    customerId = customer.id;
    await supabaseAdmin
      .from('subscriptions')
      .upsert({ user_id: userId, stripe_customer_id: customerId }, { onConflict: 'user_id' });
  }

  // integration_identifier tags the session for Dashboard tracking - suffix
  // is an arbitrary 8-letter label, not a secret.
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: getProPriceId(locale), quantity: 1 }],
    success_url: `${siteUrl}/${locale}/dashboard/settings?upgraded=true`,
    cancel_url: `${siteUrl}/${locale}/dashboard/settings`,
    metadata: { supabase_user_id: userId },
    integration_identifier: 'growpathpro',
  });

  return NextResponse.json({ url: session.url });
}
