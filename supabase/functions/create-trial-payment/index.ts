import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const body = await req.json();
    const { name, phone, direction_id, direction_name, returnUrl } = body;

    if (!name?.trim() || !phone?.trim() || !direction_id || !returnUrl) {
      return new Response(JSON.stringify({ error: "Заполните все поля" }), {
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
          value: "550.00",
          currency: "RUB",
        },
        confirmation: {
          type: "redirect",
          return_url: returnUrl,
        },
        capture: true,
        description: `Пробное занятие: ${direction_name || "танцы"}`,
        metadata: {
          type: "trial",
          direction_id,
          client_name: name,
          client_phone: phone,
        },
      }),
    });

    const paymentData = await paymentResponse.json();

    if (!paymentResponse.ok) {
      console.error("YooKassa error:", paymentData);
      return new Response(JSON.stringify({ error: "Ошибка создания платежа" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
