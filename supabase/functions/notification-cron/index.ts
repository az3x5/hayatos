import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Running notification cron job...')

    const results = {
      processedNotifications: 0,
      createdReminders: 0,
      cleanedUpNotifications: 0,
      errors: [] as string[],
    }

    try {
      // 1. Process pending notifications
      console.log('Processing pending notifications...')
      const processResponse = await fetch(`${supabaseUrl}/functions/v1/process-notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (processResponse.ok) {
        const processResult = await processResponse.json()
        results.processedNotifications = processResult.processed || 0
        console.log(`Processed ${results.processedNotifications} notifications`)
      } else {
        const error = `Failed to process notifications: ${processResponse.statusText}`
        console.error(error)
        results.errors.push(error)
      }
    } catch (error) {
      const errorMsg = `Error processing notifications: ${error.message}`
      console.error(errorMsg)
      results.errors.push(errorMsg)
    }

    try {
      // 2. Create automatic reminders
      console.log('Creating automatic reminders...')
      const reminderResults = await createAutomaticReminders(supabase)
      results.createdReminders = reminderResults.created
      console.log(`Created ${results.createdReminders} automatic reminders`)
    } catch (error) {
      const errorMsg = `Error creating reminders: ${error.message}`
      console.error(errorMsg)
      results.errors.push(errorMsg)
    }

    try {
      // 3. Clean up old notifications
      console.log('Cleaning up old notifications...')
      const { data: cleanupResult, error: cleanupError } = await supabase
        .rpc('cleanup_old_notifications', { days_to_keep: 90 })

      if (cleanupError) {
        throw cleanupError
      }

      results.cleanedUpNotifications = cleanupResult || 0
      console.log(`Cleaned up ${results.cleanedUpNotifications} old notifications`)
    } catch (error) {
      const errorMsg = `Error cleaning up notifications: ${error.message}`
      console.error(errorMsg)
      results.errors.push(errorMsg)
    }

    try {
      // 4. Update notification statistics
      console.log('Updating notification statistics...')
      await updateNotificationStatistics(supabase)
    } catch (error) {
      const errorMsg = `Error updating statistics: ${error.message}`
      console.error(errorMsg)
      results.errors.push(errorMsg)
    }

    console.log('Notification cron job completed:', results)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification cron job completed',
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in notification cron job:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function createAutomaticReminders(supabase: any): Promise<{ created: number }> {
  let created = 0

  try {
    // Create task due reminders
    created += await createTaskReminders(supabase)
    
    // Create habit check-in reminders
    created += await createHabitReminders(supabase)
    
    // Create salat reminders
    created += await createSalatReminders(supabase)
    
    // Create bill due reminders
    created += await createBillReminders(supabase)
    
    // Create medication reminders
    created += await createMedicationReminders(supabase)

  } catch (error) {
    console.error('Error creating automatic reminders:', error)
    throw error
  }

  return { created }
}

async function createTaskReminders(supabase: any): Promise<number> {
  console.log('Creating task due reminders...')
  
  // Get tasks due in the next 24 hours that don't have reminders yet
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      id,
      user_id,
      title,
      due_date,
      priority
    `)
    .lte('due_date', tomorrow.toISOString())
    .eq('status', 'pending')
    .is('completed_at', null)

  if (error) {
    console.error('Error fetching tasks for reminders:', error)
    return 0
  }

  if (!tasks || tasks.length === 0) {
    return 0
  }

  let created = 0

  for (const task of tasks) {
    try {
      // Check if reminder already exists
      const { data: existingReminder } = await supabase
        .from('notifications')
        .select('id')
        .eq('reference_type', 'task')
        .eq('reference_id', task.id)
        .eq('reminder_type', 'task_due')
        .eq('status', 'pending')
        .single()

      if (existingReminder) {
        continue // Skip if reminder already exists
      }

      // Create task due reminder
      const reminderTime = new Date(task.due_date)
      reminderTime.setHours(reminderTime.getHours() - 1) // 1 hour before due

      const { error: createError } = await supabase
        .rpc('create_notification', {
          user_uuid: task.user_id,
          notification_type_key: 'task_due',
          title_text: 'Task Due Soon',
          body_text: `Don't forget: ${task.title}`,
          scheduled_time: reminderTime.toISOString(),
          notification_data: { task_id: task.id, task_title: task.title },
          reference_type_param: 'task',
          reference_id_param: task.id,
          repeat_pattern_param: 'none',
          delivery_methods_param: ['push']
        })

      if (!createError) {
        created++
      }

    } catch (error) {
      console.error(`Error creating reminder for task ${task.id}:`, error)
    }
  }

  console.log(`Created ${created} task reminders`)
  return created
}

async function createHabitReminders(supabase: any): Promise<number> {
  console.log('Creating habit check-in reminders...')
  
  // Get active habits that need daily reminders
  const { data: habits, error } = await supabase
    .from('habits')
    .select(`
      id,
      user_id,
      name,
      reminder_time,
      is_active
    `)
    .eq('is_active', true)
    .not('reminder_time', 'is', null)

  if (error) {
    console.error('Error fetching habits for reminders:', error)
    return 0
  }

  if (!habits || habits.length === 0) {
    return 0
  }

  let created = 0

  for (const habit of habits) {
    try {
      // Check if reminder for today already exists
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

      const { data: existingReminder } = await supabase
        .from('notifications')
        .select('id')
        .eq('reference_type', 'habit')
        .eq('reference_id', habit.id)
        .eq('reminder_type', 'habit_checkin')
        .gte('scheduled_at', startOfDay.toISOString())
        .lt('scheduled_at', endOfDay.toISOString())
        .single()

      if (existingReminder) {
        continue // Skip if reminder already exists for today
      }

      // Create habit reminder for today
      const reminderTime = new Date()
      const [hours, minutes] = habit.reminder_time.split(':')
      reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      // If time has passed today, schedule for tomorrow
      if (reminderTime < new Date()) {
        reminderTime.setDate(reminderTime.getDate() + 1)
      }

      const { error: createError } = await supabase
        .rpc('create_notification', {
          user_uuid: habit.user_id,
          notification_type_key: 'habit_checkin',
          title_text: 'Time for Your Habit',
          body_text: `Don't forget: ${habit.name}`,
          scheduled_time: reminderTime.toISOString(),
          notification_data: { habit_id: habit.id, habit_name: habit.name },
          reference_type_param: 'habit',
          reference_id_param: habit.id,
          repeat_pattern_param: 'daily',
          delivery_methods_param: ['push']
        })

      if (!createError) {
        created++
      }

    } catch (error) {
      console.error(`Error creating reminder for habit ${habit.id}:`, error)
    }
  }

  console.log(`Created ${created} habit reminders`)
  return created
}

async function createSalatReminders(supabase: any): Promise<number> {
  console.log('Creating salat reminders...')
  
  // Get users with salat notifications enabled
  const { data: users, error } = await supabase
    .from('notification_settings')
    .select('user_id')
    .eq('salat_notifications', true)
    .eq('salat_reminders', true)

  if (error) {
    console.error('Error fetching users for salat reminders:', error)
    return 0
  }

  if (!users || users.length === 0) {
    return 0
  }

  let created = 0

  // Prayer times (simplified - in production, calculate based on location)
  const prayerTimes = [
    { name: 'Fajr', time: '05:30' },
    { name: 'Dhuhr', time: '12:30' },
    { name: 'Asr', time: '15:45' },
    { name: 'Maghrib', time: '18:15' },
    { name: 'Isha', time: '19:45' },
  ]

  for (const user of users) {
    for (const prayer of prayerTimes) {
      try {
        // Check if reminder for today already exists
        const today = new Date()
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

        const { data: existingReminder } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.user_id)
          .eq('reminder_type', 'salat_reminder')
          .ilike('body', `%${prayer.name}%`)
          .gte('scheduled_at', startOfDay.toISOString())
          .lt('scheduled_at', endOfDay.toISOString())
          .single()

        if (existingReminder) {
          continue // Skip if reminder already exists for today
        }

        // Create salat reminder
        const reminderTime = new Date()
        const [hours, minutes] = prayer.time.split(':')
        reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

        // If time has passed today, schedule for tomorrow
        if (reminderTime < new Date()) {
          reminderTime.setDate(reminderTime.getDate() + 1)
        }

        const { error: createError } = await supabase
          .rpc('create_notification', {
            user_uuid: user.user_id,
            notification_type_key: 'salat_reminder',
            title_text: 'Prayer Time',
            body_text: `Time for ${prayer.name} prayer`,
            scheduled_time: reminderTime.toISOString(),
            notification_data: { prayer_name: prayer.name, prayer_time: prayer.time },
            reference_type_param: 'salat',
            reference_id_param: null,
            repeat_pattern_param: 'daily',
            delivery_methods_param: ['push']
          })

        if (!createError) {
          created++
        }

      } catch (error) {
        console.error(`Error creating salat reminder for user ${user.user_id}:`, error)
      }
    }
  }

  console.log(`Created ${created} salat reminders`)
  return created
}

async function createBillReminders(supabase: any): Promise<number> {
  console.log('Creating bill due reminders...')
  
  // Get bills due in the next 3 days
  const threeDaysFromNow = new Date()
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
  
  const { data: bills, error } = await supabase
    .from('transactions')
    .select(`
      id,
      user_id,
      description,
      amount,
      due_date
    `)
    .eq('type', 'expense')
    .eq('category', 'bills')
    .lte('due_date', threeDaysFromNow.toISOString())
    .is('paid_at', null)

  if (error) {
    console.error('Error fetching bills for reminders:', error)
    return 0
  }

  if (!bills || bills.length === 0) {
    return 0
  }

  let created = 0

  for (const bill of bills) {
    try {
      // Check if reminder already exists
      const { data: existingReminder } = await supabase
        .from('notifications')
        .select('id')
        .eq('reference_type', 'transaction')
        .eq('reference_id', bill.id)
        .eq('reminder_type', 'bill_due')
        .eq('status', 'pending')
        .single()

      if (existingReminder) {
        continue // Skip if reminder already exists
      }

      // Create bill due reminder
      const reminderTime = new Date(bill.due_date)
      reminderTime.setDate(reminderTime.getDate() - 1) // 1 day before due

      const { error: createError } = await supabase
        .rpc('create_notification', {
          user_uuid: bill.user_id,
          notification_type_key: 'bill_due',
          title_text: 'Bill Due Soon',
          body_text: `${bill.description} - $${bill.amount}`,
          scheduled_time: reminderTime.toISOString(),
          notification_data: { 
            bill_id: bill.id, 
            bill_name: bill.description,
            amount: bill.amount 
          },
          reference_type_param: 'transaction',
          reference_id_param: bill.id,
          repeat_pattern_param: 'none',
          delivery_methods_param: ['push']
        })

      if (!createError) {
        created++
      }

    } catch (error) {
      console.error(`Error creating reminder for bill ${bill.id}:`, error)
    }
  }

  console.log(`Created ${created} bill reminders`)
  return created
}

async function createMedicationReminders(supabase: any): Promise<number> {
  console.log('Creating medication reminders...')
  
  // Get active medications with reminders
  const { data: medications, error } = await supabase
    .from('health_metrics')
    .select(`
      id,
      user_id,
      metric_name,
      notes
    `)
    .eq('metric_type', 'medication')
    .not('notes', 'is', null)

  if (error) {
    console.error('Error fetching medications for reminders:', error)
    return 0
  }

  if (!medications || medications.length === 0) {
    return 0
  }

  let created = 0

  for (const medication of medications) {
    try {
      // Parse medication schedule from notes (simplified)
      const scheduleMatch = medication.notes.match(/(\d{1,2}):(\d{2})/g)
      if (!scheduleMatch) continue

      for (const timeStr of scheduleMatch) {
        // Check if reminder for today already exists
        const today = new Date()
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

        const { data: existingReminder } = await supabase
          .from('notifications')
          .select('id')
          .eq('reference_type', 'medication')
          .eq('reference_id', medication.id)
          .eq('reminder_type', 'medication')
          .gte('scheduled_at', startOfDay.toISOString())
          .lt('scheduled_at', endOfDay.toISOString())
          .single()

        if (existingReminder) {
          continue // Skip if reminder already exists for today
        }

        // Create medication reminder
        const reminderTime = new Date()
        const [hours, minutes] = timeStr.split(':')
        reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

        // If time has passed today, schedule for tomorrow
        if (reminderTime < new Date()) {
          reminderTime.setDate(reminderTime.getDate() + 1)
        }

        const { error: createError } = await supabase
          .rpc('create_notification', {
            user_uuid: medication.user_id,
            notification_type_key: 'medication_reminder',
            title_text: 'Medication Time',
            body_text: `Time to take: ${medication.metric_name}`,
            scheduled_time: reminderTime.toISOString(),
            notification_data: { 
              medication_id: medication.id,
              medication_name: medication.metric_name 
            },
            reference_type_param: 'medication',
            reference_id_param: medication.id,
            repeat_pattern_param: 'daily',
            delivery_methods_param: ['push']
          })

        if (!createError) {
          created++
        }
      }

    } catch (error) {
      console.error(`Error creating reminder for medication ${medication.id}:`, error)
    }
  }

  console.log(`Created ${created} medication reminders`)
  return created
}

async function updateNotificationStatistics(supabase: any): Promise<void> {
  console.log('Updating notification statistics...')
  
  // Update delivery rates, popular notification types, etc.
  // This is a placeholder for analytics updates
  
  try {
    // Calculate delivery rates by platform
    const { data: deliveryStats } = await supabase
      .from('notification_logs')
      .select('platform, status')
      .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

    if (deliveryStats) {
      console.log('Delivery stats calculated:', deliveryStats.length, 'records')
    }

    // Update user engagement metrics
    const { data: engagementStats } = await supabase
      .from('notification_interactions')
      .select('action_type, user_id')
      .gte('interacted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

    if (engagementStats) {
      console.log('Engagement stats calculated:', engagementStats.length, 'interactions')
    }

  } catch (error) {
    console.error('Error updating notification statistics:', error)
    throw error
  }
}
