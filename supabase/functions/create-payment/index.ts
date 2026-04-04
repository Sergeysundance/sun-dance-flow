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
      Deno.env.get("SUPABASE_ANON_KEY")!,
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
    const { subscription_type_id, returnUrl, bonus_points_to_use = 0, apply_teacher_discount = false } = body;

    if (!subscription_type_id || !returnUrl) {
      return new Response(JSON.stringify({ error: "Неверные параметры" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: plan, error: planError } = await adminClient
      .from("subscription_types")
      .select("id, name, price, hours_count, active, duration_days")
      .eq("id", subscription_type_id)
      .eq("active", true)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: "Абонемент не найден или неактивен" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify teacher discount eligibility
    let teacherDiscount = 0;
    if (apply_teacher_discount) {
      const { data: teacherRecord } = await adminClient
        .from("teachers")
        .select("id")
        .eq("user_id", user.id)
        .eq("active", true)
        .maybeSingle();

      if (teacherRecord) {
        teacherDiscount = Math.round(plan.price * 0.2);
      }
    }

    const priceAfterTeacherDiscount = plan.price - teacherDiscount;

    // Validate bonus points
    let validBonusPoints = Math.max(0, Math.floor(bonus_points_to_use));
    if (validBonusPoints > 0) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("bonus_points")
        .eq("user_id", user.id)
        .single();

      if (!profile || profile.bonus_points < validBonusPoints) {
        return new Response(JSON.stringify({ error: "Недостаточно бонусных баллов" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      validBonusPoints = Math.min(validBonusPoints, priceAfterTeacherDiscount);
    }

    const finalAmount = priceAfterTeacherDiscount - validBonusPoints;

    // If fully covered by discount + bonus points, create subscription directly
    if (finalAmount <= 0) {
      if (validBonusPoints > 0) {
        const { data: currentProfile } = await adminClient
          .from("profiles")
          .select("bonus_points")
          .eq("user_id", user.id)
          .single();
        
        await adminClient
          .from("profiles")
          .update({ bonus_points: (currentProfile?.bonus_points || 0) - validBonusPoints })
          .eq("user_id", user.id);
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (plan.duration_days || 30));

      await adminClient.from("user_subscriptions").insert({
        user_id: user.id,
        subscription_type_id: plan.id,
        hours_remaining: plan.hours_count || 0,
        hours_total: plan.hours_count || 0,
        expires_at: expiresAt.toISOString(),
      });

      return new Response(
        JSON.stringify({
          payment_id: null,
          confirmation_url: returnUrl,
          status: "succeeded",
          bonus_used: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const shopId = Deno.env.get("YOKASSA_SHOP_ID");
    const secretKey = Deno.env.get("YOKASSA_SECRET_KEY");

    if (!shopId || !secretKey) {
      return new Response(JSON.stringify({ error: "Платёжная система не настроена" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const descParts = [plan.name];
    if (teacherDiscount > 0) descParts.push(`скидка преподавателя ${teacherDiscount}₽`);
    if (validBonusPoints > 0) descParts.push(`скидка ${validBonusPoints} бонусов`);

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
          value: finalAmount.toFixed(2),
          currency: "RUB",
        },
        confirmation: {
          type: "redirect",
          return_url: returnUrl,
        },
        capture: true,
        description: descParts.length > 1 ? `${descParts[0]} (${descParts.slice(1).join(', ')})` : descParts[0],
        save_payment_method: true,
        metadata: {
          user_id: user.id,
          subscription_type_id: plan.id,
          hours: plan.hours_count,
          bonus_points_used: validBonusPoints,
          teacher_discount: teacherDiscount,
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

    if (validBonusPoints > 0) {
      const { data: currentProfile } = await adminClient
        .from("profiles")
        .select("bonus_points")
        .eq("user_id", user.id)
        .single();

      await adminClient
        .from("profiles")
        .update({ bonus_points: (currentProfile?.bonus_points || 0) - validBonusPoints })
        .eq("user_id", user.id);
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
