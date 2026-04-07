import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Find active, non-frozen subscriptions expiring within 7 days
    const { data: expiring, error: fetchErr } = await admin
      .from("user_subscriptions")
      .select("id, user_id, subscription_type_id, expires_at, hours_remaining")
      .eq("active", true)
      .eq("frozen", false)
      .gt("hours_remaining", 0)
      .lte("expires_at", sevenDaysFromNow.toISOString())
      .gte("expires_at", now.toISOString());

    if (fetchErr) throw fetchErr;
    if (!expiring || expiring.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get subscription type names
    const typeIds = [...new Set(expiring.map((s) => s.subscription_type_id))];
    const { data: types } = await admin
      .from("subscription_types")
      .select("id, name")
      .in("id", typeIds);
    const typeMap = new Map((types || []).map((t) => [t.id, t.name]));

    // Check which users already have a recent (last 24h) expiry notification to avoid duplicates
    const userIds = [...new Set(expiring.map((s) => s.user_id))];
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: recentNotifs } = await admin
      .from("notifications")
      .select("user_id, title")
      .in("user_id", userIds)
      .eq("title", "Абонемент скоро истекает")
      .gte("created_at", oneDayAgo.toISOString());

    const recentlyNotified = new Set((recentNotifs || []).map((n) => n.user_id));

    // Send notifications
    const notifications = expiring
      .filter((s) => !recentlyNotified.has(s.user_id))
      .map((s) => {
        const typeName = typeMap.get(s.subscription_type_id) || "Абонемент";
        const daysLeft = Math.ceil(
          (new Date(s.expires_at).getTime() - now.getTime()) / 86400000
        );
        return {
          user_id: s.user_id,
          title: "Абонемент скоро истекает",
          message: `Ваш абонемент "${typeName}" истекает через ${daysLeft} дн. (${new Date(s.expires_at).toLocaleDateString("ru-RU")}). Остаток: ${s.hours_remaining} ч. Рекомендуем продлить абонемент.`,
          type: "warning",
        };
      });

    // Deduplicate by user_id (one notification per user)
    const unique = new Map(notifications.map((n) => [n.user_id, n]));
    const toInsert = [...unique.values()];

    if (toInsert.length > 0) {
      const { error: insertErr } = await admin
        .from("notifications")
        .insert(toInsert);
      if (insertErr) throw insertErr;
    }

    return new Response(JSON.stringify({ sent: toInsert.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
