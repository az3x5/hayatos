import { createSupabaseRouteHandlerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const connectSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_in: z.number().optional(),
});

const syncSchema = z.object({
  data_types: z.array(z.enum(['steps', 'calories', 'heart_rate', 'weight', 'sleep'])).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

// Google Fit API endpoints
const GOOGLE_FIT_BASE_URL = 'https://www.googleapis.com/fitness/v1/users/me';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'connect') {
      return handleConnect(request, supabase, session.user.id);
    } else if (action === 'sync') {
      return handleSync(request, supabase, session.user.id);
    } else if (action === 'disconnect') {
      return handleDisconnect(supabase, session.user.id);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in Google Fit integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleConnect(request: NextRequest, supabase: any, userId: string) {
  try {
    const body = await request.json();
    const validatedData = connectSchema.parse(body);

    // Calculate token expiration
    const expiresAt = validatedData.expires_in 
      ? new Date(Date.now() + validatedData.expires_in * 1000)
      : new Date(Date.now() + 3600 * 1000); // Default 1 hour

    // Store integration settings
    const { data: integration, error } = await supabase
      .from('health_integrations')
      .upsert({
        user_id: userId,
        provider: 'google_fit',
        is_enabled: true,
        access_token: validatedData.access_token, // In production, encrypt this
        refresh_token: validatedData.refresh_token, // In production, encrypt this
        token_expires_at: expiresAt.toISOString(),
        sync_settings: {
          data_types: ['steps', 'calories', 'heart_rate', 'weight'],
          auto_sync: true,
          sync_frequency: 'hourly',
        },
        last_sync_at: null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing Google Fit integration:', error);
      return NextResponse.json({ error: 'Failed to connect Google Fit' }, { status: 500 });
    }

    // Perform initial sync
    await performSync(supabase, userId, validatedData.access_token);

    return NextResponse.json({ 
      data: integration,
      message: 'Google Fit connected successfully' 
    });

  } catch (error) {
    console.error('Error connecting Google Fit:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to connect Google Fit' }, { status: 500 });
  }
}

async function handleSync(request: NextRequest, supabase: any, userId: string) {
  try {
    const body = await request.json();
    const validatedData = syncSchema.parse(body);

    // Get integration settings
    const { data: integration, error: integrationError } = await supabase
      .from('health_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'google_fit')
      .eq('is_enabled', true)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json({ error: 'Google Fit not connected' }, { status: 404 });
    }

    // Check if token is expired
    if (new Date(integration.token_expires_at) <= new Date()) {
      // Try to refresh token
      const refreshResult = await refreshAccessToken(integration.refresh_token);
      if (!refreshResult.success) {
        return NextResponse.json({ error: 'Google Fit token expired. Please reconnect.' }, { status: 401 });
      }
      
      // Update token in database
      await supabase
        .from('health_integrations')
        .update({
          access_token: refreshResult.access_token,
          token_expires_at: refreshResult.expires_at,
        })
        .eq('id', integration.id);
      
      integration.access_token = refreshResult.access_token;
    }

    // Perform sync
    const syncResult = await performSync(
      supabase, 
      userId, 
      integration.access_token,
      validatedData.data_types,
      validatedData.start_date,
      validatedData.end_date
    );

    // Update last sync time
    await supabase
      .from('health_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integration.id);

    return NextResponse.json({ 
      data: syncResult,
      message: 'Sync completed successfully' 
    });

  } catch (error) {
    console.error('Error syncing Google Fit data:', error);
    return NextResponse.json({ error: 'Failed to sync data' }, { status: 500 });
  }
}

async function handleDisconnect(supabase: any, userId: string) {
  try {
    const { error } = await supabase
      .from('health_integrations')
      .update({ is_enabled: false })
      .eq('user_id', userId)
      .eq('provider', 'google_fit');

    if (error) {
      console.error('Error disconnecting Google Fit:', error);
      return NextResponse.json({ error: 'Failed to disconnect Google Fit' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Google Fit disconnected successfully' });

  } catch (error) {
    console.error('Error disconnecting Google Fit:', error);
    return NextResponse.json({ error: 'Failed to disconnect Google Fit' }, { status: 500 });
  }
}

async function performSync(
  supabase: any,
  userId: string,
  accessToken: string,
  dataTypes?: string[],
  startDate?: string,
  endDate?: string
) {
  const results = {
    steps: 0,
    calories: 0,
    heart_rate: 0,
    weight: 0,
    errors: [] as string[],
  };

  const defaultDataTypes = ['steps', 'calories', 'heart_rate', 'weight'];
  const typesToSync = dataTypes || defaultDataTypes;

  const endTime = endDate ? new Date(endDate) : new Date();
  const startTime = startDate ? new Date(startDate) : new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

  try {
    // Sync steps data
    if (typesToSync.includes('steps')) {
      const stepsData = await fetchGoogleFitData(
        accessToken,
        'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
        startTime,
        endTime
      );
      
      for (const dataPoint of stepsData) {
        try {
          await supabase
            .from('health_logs')
            .upsert({
              user_id: userId,
              type: 'steps',
              value: { count: dataPoint.value },
              start_time: dataPoint.startTime,
              end_time: dataPoint.endTime,
              source: 'google_fit',
              external_id: dataPoint.id,
            });
          results.steps++;
        } catch (error) {
          console.error('Error inserting steps data:', error);
        }
      }
    }

    // Sync calories data
    if (typesToSync.includes('calories')) {
      const caloriesData = await fetchGoogleFitData(
        accessToken,
        'derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended',
        startTime,
        endTime
      );
      
      for (const dataPoint of caloriesData) {
        try {
          await supabase
            .from('health_logs')
            .upsert({
              user_id: userId,
              type: 'calories',
              value: { amount: dataPoint.value },
              start_time: dataPoint.startTime,
              end_time: dataPoint.endTime,
              source: 'google_fit',
              external_id: dataPoint.id,
            });
          results.calories++;
        } catch (error) {
          console.error('Error inserting calories data:', error);
        }
      }
    }

    // Sync heart rate data
    if (typesToSync.includes('heart_rate')) {
      const heartRateData = await fetchGoogleFitData(
        accessToken,
        'derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm',
        startTime,
        endTime
      );
      
      for (const dataPoint of heartRateData) {
        try {
          await supabase
            .from('health_logs')
            .upsert({
              user_id: userId,
              type: 'heart_rate',
              value: { bpm: dataPoint.value },
              start_time: dataPoint.startTime,
              end_time: dataPoint.endTime,
              source: 'google_fit',
              external_id: dataPoint.id,
            });
          results.heart_rate++;
        } catch (error) {
          console.error('Error inserting heart rate data:', error);
        }
      }
    }

    // Sync weight data
    if (typesToSync.includes('weight')) {
      const weightData = await fetchGoogleFitData(
        accessToken,
        'derived:com.google.weight:com.google.android.gms:merge_weight',
        startTime,
        endTime
      );
      
      for (const dataPoint of weightData) {
        try {
          await supabase
            .from('health_logs')
            .upsert({
              user_id: userId,
              type: 'weight',
              value: { weight: dataPoint.value, unit: 'kg' },
              start_time: dataPoint.startTime,
              end_time: dataPoint.endTime,
              source: 'google_fit',
              external_id: dataPoint.id,
            });
          results.weight++;
        } catch (error) {
          console.error('Error inserting weight data:', error);
        }
      }
    }

  } catch (error) {
    console.error('Error in performSync:', error);
    results.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return results;
}

async function fetchGoogleFitData(
  accessToken: string,
  dataSourceId: string,
  startTime: Date,
  endTime: Date
) {
  const response = await fetch(
    `${GOOGLE_FIT_BASE_URL}/dataSources/${dataSourceId}/datasets/${startTime.getTime()}000000-${endTime.getTime()}000000`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Google Fit API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  return (data.point || []).map((point: any) => ({
    id: `${dataSourceId}-${point.startTimeNanos}`,
    value: point.value[0]?.fpVal || point.value[0]?.intVal || 0,
    startTime: new Date(parseInt(point.startTimeNanos) / 1000000).toISOString(),
    endTime: new Date(parseInt(point.endTimeNanos) / 1000000).toISOString(),
  }));
}

async function refreshAccessToken(refreshToken: string) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      return { success: false };
    }

    const data = await response.json();
    
    return {
      success: true,
      access_token: data.access_token,
      expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Error refreshing Google token:', error);
    return { success: false };
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get integration status
    const { data: integration, error } = await supabase
      .from('health_integrations')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('provider', 'google_fit')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching Google Fit integration:', error);
      return NextResponse.json({ error: 'Failed to fetch integration status' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: integration || null,
      is_connected: !!integration?.is_enabled,
    });

  } catch (error) {
    console.error('Error in GET Google Fit integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
