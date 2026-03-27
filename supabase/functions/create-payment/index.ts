import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Необходима авторизация" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Неверная авторизация" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { subscription_type_id, returnUrl } = body;

    if (!subscription_type_id || !returnUrl) {
      return new Response(JSON.stringify({ error: "Неверные параметры" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the subscription type from DB
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: plan, error: planError } = await adminClient
      .from("subscription_types")
      .select("id, name, price, hours_count, active")
      .eq("id", subscription_type_id)
      .eq("active", true)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: "Абонемент не найден или неактивен" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const shopId = Deno.env.get("YOKASSA_SHOP_ID");
    const secretKey = Deno.env.get("YOKASSA_SECRET_KEY");

    if (!shopId || !secretKey) {
      return new Response(JSON.stringify({ error: "Платёжная система не настроена" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const idempotenceKey = crypto.randomUUID();
    const paymentResponse = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
        Authorization: "Basic " + btoa(`${shopId}:${secretKey}`),
      },
      body: JSON.stringify({
        amount: {
          value: plan.price.toFixed(2),
          currency: "RUB",
        },
        confirmation: {
          type: "redirect",
          return_url: returnUrl,
        },
        capture: true,
        description: plan.name,
        save_payment_method: true,
        metadata: {
          user_id: user.id,
          subscription_type_id: plan.id,
          hours: plan.hours_count,
        },
      }),
    });

    const paymentData = await paymentResponse.json();

    if (!paymentResponse.ok) {
      console.error("YooKassa error:", paymentData);
      return new Response(
        JSON.stringify({ error: "Ошибка создания платежа" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        payment_id: paymentData.id,
        confirmation_url: paymentData.confirmation?.confirmation_url,
        status: paymentData.status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Внутренняя ошибка сервера" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
