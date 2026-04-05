import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.100.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Get today's month and day (UTC)
    const now = new Date()
    const month = now.getUTCMonth() + 1
    const day = now.getUTCDate()
    const monthStr = String(month).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')

    console.log(`Checking birthdays for ${dayStr}.${monthStr}`)

    // Find students with today's birthday
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, middle_name, birth_date')
      .not('birth_date', 'is', null)

    const birthdayProfiles = (profiles || []).filter(p => {
      if (!p.birth_date) return false
      const bd = new Date(p.birth_date)
      return (bd.getUTCMonth() + 1) === month && bd.getUTCDate() === day
    })

    console.log(`Found ${birthdayProfiles.length} student(s) with birthday today`)

    // Find teachers with today's birthday — teachers don't have birth_date in schema
    // so we skip teachers for now (no birth_date column)

    // Get user emails from auth
    const notifiedCount = { email: 0, notification: 0 }

    for (const profile of birthdayProfiles) {
      const firstName = profile.first_name || 'Ученик'
      const fullName = [profile.last_name, profile.first_name, profile.middle_name].filter(Boolean).join(' ')

      // Create in-app notification
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: profile.user_id,
        title: '🎂 С Днём Рождения!',
        message: `Дорогой(ая) ${firstName}, поздравляем вас с Днём Рождения! Желаем здоровья, счастья, вдохновения и новых танцевальных побед! С любовью, команда Sun Dance School 🎉`,
        type: 'birthday',
      })

      if (!notifError) notifiedCount.notification++

      // Get email from auth.users
      const { data: authData } = await supabase.auth.admin.getUserById(profile.user_id)
      const email = authData?.user?.email

      if (email) {
        // Send birthday email
        const html = `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#000;font-size:24px;margin:0;">
        <span style="color:#F59E0B;">SUN</span> DANCE SCHOOL
      </h1>
    </div>
    <div style="text-align:center;font-size:48px;margin-bottom:16px;">🎂🎉</div>
    <h2 style="color:#000;font-size:22px;margin:0 0 16px;text-align:center;">
      С Днём Рождения, ${firstName}!
    </h2>
    <div style="background:#FFF8E1;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
      <p style="color:#333;font-size:16px;line-height:1.6;margin:0;">
        Дорогой(ая) <strong>${fullName}</strong>, поздравляем вас с Днём Рождения! 
      </p>
      <p style="color:#555;font-size:14px;line-height:1.6;margin:16px 0 0;">
        Желаем вам здоровья, счастья, вдохновения и новых танцевальных побед! 
        Пусть каждый день приносит радость и яркие эмоции! 💃🕺
      </p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="https://sun-dance-flow.lovable.app" style="display:inline-block;background:#F59E0B;color:#000;text-decoration:none;padding:12px 32px;border-radius:6px;font-weight:bold;font-size:14px;">
        ПЕРЕЙТИ В КАБИНЕТ
      </a>
    </div>
    <hr style="border:none;border-top:1px solid #eee;margin:32px 0;" />
    <p style="color:#999;font-size:12px;text-align:center;margin:0;">
      С любовью, команда Sun Dance School ❤️
    </p>
  </div>
</body>
</html>`

        // Use Supabase auth admin to send email
        try {
          const res = await fetch(`${SUPABASE_URL}/functions/v1/send-birthday-email-internal`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ email, html, name: firstName }),
          })
          // Even if email sending fails, we already created the notification
          console.log(`Birthday email attempt for ${email}: ${res.status}`)
          if (res.ok) notifiedCount.email++
        } catch (e) {
          console.error(`Failed to send birthday email to ${email}:`, e)
        }
      }
    }

    console.log(`Birthday check complete. Notifications: ${notifiedCount.notification}, Emails: ${notifiedCount.email}`)

    return new Response(JSON.stringify({
      success: true,
      date: `${dayStr}.${monthStr}`,
      birthdayCount: birthdayProfiles.length,
      notified: notifiedCount,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Birthday check error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
