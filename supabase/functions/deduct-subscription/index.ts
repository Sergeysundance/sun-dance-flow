import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find bookings for classes starting within the next 6 hours that haven't been deducted yet
    const now = new Date();
    const sixHoursLater = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    
    const todayStr = now.toISOString().split("T")[0];
    const tomorrowStr = sixHoursLater.toISOString().split("T")[0];

    // Get classes happening today or tomorrow (to cover the 6-hour window across midnight)
    const { data: classes, error: classError } = await supabase
      .from("schedule_classes")
      .select("id, date, start_time, direction_id")
      .in("date", [todayStr, ...(todayStr !== tomorrowStr ? [tomorrowStr] : [])])
      .eq("cancelled", false);

    if (classError) throw classError;
    if (!classes || classes.length === 0) {
      return new Response(JSON.stringify({ message: "No classes in window", deducted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter classes starting within 6 hours
    const classesInWindow = classes.filter((c) => {
      const classStart = new Date(`${c.date}T${c.start_time}`);
      return classStart > now && classStart <= sixHoursLater;
    });

    if (classesInWindow.length === 0) {
      return new Response(JSON.stringify({ message: "No classes in 6h window", deducted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const classIds = classesInWindow.map((c) => c.id);

    // Get bookings for these classes
    const { data: bookings, error: bookingError } = await supabase
      .from("bookings")
      .select("id, user_id, class_id")
      .in("class_id", classIds);

    if (bookingError) throw bookingError;
    if (!bookings || bookings.length === 0) {
      return new Response(JSON.stringify({ message: "No bookings for classes", deducted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get existing deductions to avoid double-deducting
    const bookingIds = bookings.map((b) => b.id);
    const { data: existingDeductions } = await supabase
      .from("subscription_deductions")
      .select("booking_id")
      .in("booking_id", bookingIds);

    const alreadyDeducted = new Set((existingDeductions || []).map((d) => d.booking_id));

    let deductedCount = 0;

    for (const booking of bookings) {
      if (alreadyDeducted.has(booking.id)) continue;

      // Find active subscription for this user with remaining hours
      const { data: subs } = await supabase
        .from("user_subscriptions")
        .select("id, hours_remaining")
        .eq("user_id", booking.user_id)
        .eq("active", true)
        .gt("hours_remaining", 0)
        .gte("expires_at", now.toISOString())
        .order("expires_at", { ascending: true })
        .limit(1);

      if (!subs || subs.length === 0) continue;

      const sub = subs[0];
      const classInfo = classesInWindow.find((c) => c.id === booking.class_id);
      const hoursToDeduct = 1; // 1 class = 1 hour deduction

      // Deduct
      const { error: updateError } = await supabase
        .from("user_subscriptions")
        .update({ hours_remaining: sub.hours_remaining - hoursToDeduct })
        .eq("id", sub.id);

      if (updateError) {
        console.error("Failed to update subscription:", updateError);
        continue;
      }

      // Log deduction
      const { error: insertError } = await supabase
        .from("subscription_deductions")
        .insert({
          user_subscription_id: sub.id,
          booking_id: booking.id,
          hours_deducted: hoursToDeduct,
        });

      if (insertError) {
        console.error("Failed to log deduction:", insertError);
      }

      deductedCount++;
    }

    return new Response(
      JSON.stringify({ message: "Deduction complete", deducted: deductedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Deduction error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
