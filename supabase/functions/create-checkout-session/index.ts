import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { stripe } from '../_shared/stripe.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';

const PLANS = {
  basic: {
    price: 999, // €9.99
    name: 'Basic'
  },
  premium: {
    price: 1999, // €19.99
    name: 'Premium'
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { planId } = await req.json();
    const plan = PLANS[planId];

    if (!plan) {
      throw new Error('Invalid plan');
    }

    // Get user from auth header
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    const user = await supabaseClient.auth.getUser(authHeader?.split(' ')[1]);

    if (!user.data.user) {
      throw new Error('Not authenticated');
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `NeuronalFit ${plan.name}`,
              description: `Accès ${plan.name} à NeuronalFit`
            },
            unit_amount: plan.price
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/payment/success`,
      cancel_url: `${req.headers.get('origin')}/payment/error`,
      customer_email: user.data.user.email,
      metadata: {
        userId: user.data.user.id,
        planId
      }
    });

    return new Response(
      JSON.stringify({ session }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
