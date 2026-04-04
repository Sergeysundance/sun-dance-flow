import { corsHeaders } from '@supabase/supabase-js/cors'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.100.1'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Verify the requesting user is the teacher for this class
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { classId } = await req.json()
    if (!classId) {
      return new Response(JSON.stringify({ error: 'classId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get the class details
    const { data: classData, error: classError } = await supabase
      .from('schedule_classes')
      .select('*')
      .eq('id', classId)
      .single()

    if (classError || !classData) {
      return new Response(JSON.stringify({ error: 'Class not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify the user is the teacher
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .eq('id', classData.teacher_id)
      .maybeSingle()

    if (!teacher) {
      return new Response(JSON.stringify({ error: 'Not authorized to cancel this class' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get direction name for notifications
    const { data: direction } = await supabase
      .from('directions')
      .select('name')
      .eq('id', classData.direction_id)
      .single()

    const dirName = direction?.name || 'Занятие'
    const classDate = classData.date
    const classTime = classData.start_time?.slice(0, 5)

    // Get all bookings for this class
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, user_id')
      .eq('class_id', classId)

    const userIds = bookings?.map(b => b.user_id) || []

    // Get user emails for email notifications
    let userEmails: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name')
        .in('user_id', userIds)

      // Get emails from auth.users
      for (const uid of userIds) {
        const { data: { user: authUser } } = await supabase.auth.admin.getUserById(uid)
        if (authUser?.email) {
          userEmails[uid] = authUser.email
        }
      }

      // Create in-app notifications for each booked user
      if (userIds.length > 0) {
        const notifications = userIds.map(uid => ({
          user_id: uid,
          title: 'Занятие отменено',
          message: `${dirName} ${classDate} в ${classTime} было отменено преподавателем.`,
          type: 'class_cancelled',
          read: false,
        }))

        await supabase.from('notifications').insert(notifications)
      }

      // Delete all bookings for this class
      await supabase.from('bookings').delete().eq('class_id', classId)
    }

    // Mark class as cancelled
    await supabase
      .from('schedule_classes')
      .update({ cancelled: true })
      .eq('id', classId)

    // Send email notifications (best effort, don't fail if emails fail)
    for (const uid of userIds) {
      const email = userEmails[uid]
      if (!email) continue
      try {
        // Use Supabase edge function for email if available, otherwise skip
        await supabase.functions.invoke('send-welcome-email', {
          body: {
            to: email,
            subject: `Занятие "${dirName}" отменено`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #F59E0B;">SUN DANCE SCHOOL</h2>
                <p>Здравствуйте!</p>
                <p>К сожалению, занятие <strong>${dirName}</strong>, запланированное на <strong>${classDate}</strong> в <strong>${classTime}</strong>, было отменено преподавателем.</p>
                <p>Приносим извинения за неудобства.</p>
                <p style="color: #999; font-size: 12px;">— Команда SUN DANCE SCHOOL</p>
              </div>
            `,
          },
        })
      } catch (e) {
        console.error(`Failed to send email to ${email}:`, e)
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      cancelledBookings: userIds.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error cancelling class:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
