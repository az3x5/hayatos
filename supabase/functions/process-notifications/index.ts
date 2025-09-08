import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  id: string;
  user_id: string;
  title: string;
  body: string;
  data: any;
  scheduled_at: string;
  delivery_methods: string[];
  priority: string;
  notification_type: string;
}

interface PushToken {
  device_id: string;
  platform: string;
  token: string;
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

    // Get Firebase credentials
    const firebaseProjectId = Deno.env.get('FIREBASE_PROJECT_ID')!
    const firebaseClientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL')!
    const firebasePrivateKey = Deno.env.get('FIREBASE_PRIVATE_KEY')!.replace(/\\n/g, '\n')

    console.log('Processing notifications...')

    // Get pending notifications
    const { data: notifications, error: notificationsError } = await supabase
      .rpc('get_pending_notifications', { batch_size: 100 })

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError)
      throw notificationsError
    }

    if (!notifications || notifications.length === 0) {
      console.log('No pending notifications found')
      return new Response(
        JSON.stringify({ message: 'No pending notifications', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${notifications.length} pending notifications`)

    let processedCount = 0
    let errorCount = 0

    // Process each notification
    for (const notification of notifications as NotificationPayload[]) {
      try {
        console.log(`Processing notification ${notification.id} for user ${notification.user_id}`)

        // Check if push notifications are enabled
        if (notification.delivery_methods.includes('push')) {
          await processPushNotification(supabase, notification, {
            projectId: firebaseProjectId,
            clientEmail: firebaseClientEmail,
            privateKey: firebasePrivateKey,
          })
        }

        // Check if email notifications are enabled
        if (notification.delivery_methods.includes('email')) {
          await processEmailNotification(supabase, notification)
        }

        // Check if SMS notifications are enabled
        if (notification.delivery_methods.includes('sms')) {
          await processSMSNotification(supabase, notification)
        }

        // Mark notification as sent
        await supabase.rpc('mark_notification_sent', {
          notification_uuid: notification.id,
          delivery_method_param: notification.delivery_methods[0], // Primary method
          platform_param: null,
          external_id_param: null,
          response_data_param: null
        })

        processedCount++
        console.log(`Successfully processed notification ${notification.id}`)

      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error)
        
        // Mark notification as failed
        await supabase
          .from('notifications')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.id)

        errorCount++
      }
    }

    console.log(`Processed ${processedCount} notifications, ${errorCount} errors`)

    return new Response(
      JSON.stringify({ 
        message: 'Notifications processed',
        processed: processedCount,
        errors: errorCount,
        total: notifications.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in process-notifications function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function processPushNotification(
  supabase: any,
  notification: NotificationPayload,
  firebaseConfig: { projectId: string; clientEmail: string; privateKey: string }
) {
  console.log(`Processing push notification for user ${notification.user_id}`)

  // Get user's push tokens
  const { data: tokens, error: tokensError } = await supabase
    .rpc('get_user_push_tokens', {
      user_uuid: notification.user_id,
      platform_filter: null
    })

  if (tokensError) {
    console.error('Error fetching push tokens:', tokensError)
    throw tokensError
  }

  if (!tokens || tokens.length === 0) {
    console.log(`No push tokens found for user ${notification.user_id}`)
    return
  }

  console.log(`Found ${tokens.length} push tokens for user ${notification.user_id}`)

  // Send push notification using FCM
  for (const tokenData of tokens as PushToken[]) {
    try {
      const result = await sendFCMNotification(
        tokenData.token,
        {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          icon: '/icons/icon-192x192.png',
          sound: 'default',
        },
        tokenData.platform as 'web' | 'android' | 'ios',
        firebaseConfig
      )

      // Log delivery attempt
      await supabase
        .from('notification_logs')
        .insert({
          notification_id: notification.id,
          user_id: notification.user_id,
          delivery_method: 'push',
          platform: tokenData.platform,
          device_token: tokenData.token,
          status: result.success ? 'sent' : 'failed',
          external_id: result.messageId,
          response_data: result,
          error_message: result.error,
          sent_at: new Date().toISOString()
        })

      console.log(`Push notification ${result.success ? 'sent' : 'failed'} to ${tokenData.platform} device`)

    } catch (error) {
      console.error(`Error sending push notification to ${tokenData.platform}:`, error)
      
      // Log failed delivery
      await supabase
        .from('notification_logs')
        .insert({
          notification_id: notification.id,
          user_id: notification.user_id,
          delivery_method: 'push',
          platform: tokenData.platform,
          device_token: tokenData.token,
          status: 'failed',
          error_message: error.message,
          sent_at: new Date().toISOString()
        })
    }
  }
}

async function sendFCMNotification(
  token: string,
  payload: {
    title: string;
    body: string;
    data?: Record<string, any>;
    icon?: string;
    sound?: string;
  },
  platform: 'web' | 'android' | 'ios',
  firebaseConfig: { projectId: string; clientEmail: string; privateKey: string }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  // Get Firebase access token
  const accessToken = await getFirebaseAccessToken(firebaseConfig)
  
  if (!accessToken) {
    throw new Error('Failed to get Firebase access token')
  }

  // Build FCM message
  const message: any = {
    token,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data ? Object.fromEntries(
      Object.entries(payload.data).map(([k, v]) => [k, String(v)])
    ) : {},
  }

  // Platform-specific configuration
  if (platform === 'android') {
    message.android = {
      priority: 'high',
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.icon,
        sound: payload.sound || 'default',
        channel_id: 'hayatos_notifications',
      },
    }
  } else if (platform === 'ios') {
    message.apns = {
      headers: {
        'apns-priority': '10',
      },
      payload: {
        aps: {
          alert: {
            title: payload.title,
            body: payload.body,
          },
          sound: payload.sound || 'default',
          'content-available': 1,
        },
      },
    }
  } else if (platform === 'web') {
    message.webpush = {
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
      },
    }
  }

  // Send FCM message
  try {
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${firebaseConfig.projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`FCM API error: ${errorData.error?.message || response.statusText}`)
    }

    const result = await response.json()
    return {
      success: true,
      messageId: result.name,
    }

  } catch (error) {
    console.error('FCM send error:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

async function getFirebaseAccessToken(
  firebaseConfig: { projectId: string; clientEmail: string; privateKey: string }
): Promise<string | null> {
  try {
    // Create JWT for Firebase service account
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: firebaseConfig.clientEmail,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }

    // Note: In a real implementation, you would use a proper JWT library
    // For this demo, we'll use a simplified approach
    const jwt = await createJWT(payload, firebaseConfig.privateKey)

    // Exchange JWT for access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    })

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`)
    }

    const tokenData = await response.json()
    return tokenData.access_token

  } catch (error) {
    console.error('Error getting Firebase access token:', error)
    return null
  }
}

// Simplified JWT creation (in production, use a proper JWT library)
async function createJWT(payload: any, privateKey: string): Promise<string> {
  // This is a simplified implementation
  // In production, use a proper JWT library like jose
  const header = { alg: 'RS256', typ: 'JWT' }
  
  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))
  
  // For demo purposes, return a placeholder
  // In real implementation, properly sign with RSA private key
  return `${encodedHeader}.${encodedPayload}.signature`
}

async function processEmailNotification(supabase: any, notification: NotificationPayload) {
  console.log(`Processing email notification for user ${notification.user_id}`)
  
  // Get user email from auth.users
  const { data: user, error } = await supabase.auth.admin.getUserById(notification.user_id)
  
  if (error || !user?.email) {
    console.log(`No email found for user ${notification.user_id}`)
    return
  }

  // In a real implementation, integrate with email service (SendGrid, AWS SES, etc.)
  console.log(`Would send email to ${user.email}: ${notification.title}`)
  
  // Log email delivery (simulated)
  await supabase
    .from('notification_logs')
    .insert({
      notification_id: notification.id,
      user_id: notification.user_id,
      delivery_method: 'email',
      status: 'sent',
      sent_at: new Date().toISOString()
    })
}

async function processSMSNotification(supabase: any, notification: NotificationPayload) {
  console.log(`Processing SMS notification for user ${notification.user_id}`)
  
  // Get user phone number from user_profiles
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('phone_number')
    .eq('user_id', notification.user_id)
    .single()
  
  if (error || !profile?.phone_number) {
    console.log(`No phone number found for user ${notification.user_id}`)
    return
  }

  // In a real implementation, integrate with SMS service (Twilio, AWS SNS, etc.)
  console.log(`Would send SMS to ${profile.phone_number}: ${notification.title}`)
  
  // Log SMS delivery (simulated)
  await supabase
    .from('notification_logs')
    .insert({
      notification_id: notification.id,
      user_id: notification.user_id,
      delivery_method: 'sms',
      status: 'sent',
      sent_at: new Date().toISOString()
    })
}
