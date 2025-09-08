import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const connectSchema = z.object({
  device_id: z.string(),
  app_version: z.string().optional(),
  permissions: z.array(z.string()),
});

const syncSchema = z.object({
  health_data: z.array(z.object({
    type: z.enum(['steps', 'calories', 'heart_rate', 'weight', 'sleep', 'blood_pressure']),
    value: z.record(z.any()),
    start_date: z.string().datetime(),
    end_date: z.string().datetime().optional(),
    source: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  })),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
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
    console.error('Error in Apple Health integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleConnect(request: NextRequest, supabase: any, userId: string) {
  try {
    const body = await request.json();
    const validatedData = connectSchema.parse(body);

    // Store integration settings
    const { data: integration, error } = await supabase
      .from('health_integrations')
      .upsert({
        user_id: userId,
        provider: 'apple_health',
        is_enabled: true,
        access_token: validatedData.device_id, // Store device ID as identifier
        sync_settings: {
          permissions: validatedData.permissions,
          data_types: validatedData.permissions,
          auto_sync: false, // Apple Health requires manual sync via app
          app_version: validatedData.app_version,
        },
        last_sync_at: null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing Apple Health integration:', error);
      return NextResponse.json({ error: 'Failed to connect Apple Health' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: integration,
      message: 'Apple Health connected successfully' 
    });

  } catch (error) {
    console.error('Error connecting Apple Health:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to connect Apple Health' }, { status: 500 });
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
      .eq('provider', 'apple_health')
      .eq('is_enabled', true)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json({ error: 'Apple Health not connected' }, { status: 404 });
    }

    const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Process each health data point
    for (const healthData of validatedData.health_data) {
      try {
        // Generate external ID for deduplication
        const externalId = `apple-${healthData.type}-${healthData.start_date}-${JSON.stringify(healthData.value)}`;

        // Check if this data point already exists
        const { data: existingLog } = await supabase
          .from('health_logs')
          .select('id')
          .eq('user_id', userId)
          .eq('type', healthData.type)
          .eq('external_id', externalId)
          .eq('source', 'apple_health')
          .single();

        if (existingLog) {
          results.skipped++;
          continue;
        }

        // Validate and transform health data based on type
        const transformedValue = transformAppleHealthValue(healthData.type, healthData.value);
        if (!transformedValue.isValid) {
          results.errors.push(`Invalid ${healthData.type} data: ${transformedValue.error}`);
          continue;
        }

        // Insert health log
        const { error: insertError } = await supabase
          .from('health_logs')
          .insert({
            user_id: userId,
            type: healthData.type,
            value: transformedValue.value,
            start_time: healthData.start_date,
            end_time: healthData.end_date || healthData.start_date,
            source: 'apple_health',
            external_id: externalId,
            notes: healthData.metadata ? JSON.stringify(healthData.metadata) : null,
          });

        if (insertError) {
          console.error('Error inserting Apple Health data:', insertError);
          results.errors.push(`Failed to insert ${healthData.type} data`);
        } else {
          results.imported++;
        }

      } catch (error) {
        console.error('Error processing health data point:', error);
        results.errors.push(`Error processing ${healthData.type} data`);
      }
    }

    // Update last sync time
    await supabase
      .from('health_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integration.id);

    return NextResponse.json({ 
      data: results,
      message: `Sync completed: ${results.imported} imported, ${results.skipped} skipped, ${results.errors.length} errors` 
    });

  } catch (error) {
    console.error('Error syncing Apple Health data:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid sync data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to sync data' }, { status: 500 });
  }
}

async function handleDisconnect(supabase: any, userId: string) {
  try {
    const { error } = await supabase
      .from('health_integrations')
      .update({ is_enabled: false })
      .eq('user_id', userId)
      .eq('provider', 'apple_health');

    if (error) {
      console.error('Error disconnecting Apple Health:', error);
      return NextResponse.json({ error: 'Failed to disconnect Apple Health' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Apple Health disconnected successfully' });

  } catch (error) {
    console.error('Error disconnecting Apple Health:', error);
    return NextResponse.json({ error: 'Failed to disconnect Apple Health' }, { status: 500 });
  }
}

function transformAppleHealthValue(type: string, value: any): { isValid: boolean; value?: any; error?: string } {
  try {
    switch (type) {
      case 'steps':
        if (typeof value.count !== 'number' || value.count < 0) {
          return { isValid: false, error: 'Invalid step count' };
        }
        return { isValid: true, value: { count: Math.round(value.count) } };

      case 'calories':
        if (typeof value.amount !== 'number' || value.amount < 0) {
          return { isValid: false, error: 'Invalid calorie amount' };
        }
        return { isValid: true, value: { amount: Math.round(value.amount) } };

      case 'heart_rate':
        if (typeof value.bpm !== 'number' || value.bpm < 30 || value.bpm > 250) {
          return { isValid: false, error: 'Invalid heart rate' };
        }
        return { isValid: true, value: { bpm: Math.round(value.bpm) } };

      case 'weight':
        if (typeof value.weight !== 'number' || value.weight < 0) {
          return { isValid: false, error: 'Invalid weight' };
        }
        const unit = value.unit || 'kg';
        return { isValid: true, value: { weight: parseFloat(value.weight.toFixed(2)), unit } };

      case 'sleep':
        if (typeof value.hours !== 'number' || value.hours < 0 || value.hours > 24) {
          return { isValid: false, error: 'Invalid sleep hours' };
        }
        const sleepValue: any = { hours: parseFloat(value.hours.toFixed(2)) };
        if (value.quality && typeof value.quality === 'number') {
          sleepValue.quality = Math.max(1, Math.min(5, Math.round(value.quality)));
        }
        return { isValid: true, value: sleepValue };

      case 'blood_pressure':
        if (typeof value.systolic !== 'number' || typeof value.diastolic !== 'number' ||
            value.systolic < 50 || value.systolic > 250 ||
            value.diastolic < 30 || value.diastolic > 150) {
          return { isValid: false, error: 'Invalid blood pressure values' };
        }
        return { 
          isValid: true, 
          value: { 
            systolic: Math.round(value.systolic), 
            diastolic: Math.round(value.diastolic) 
          } 
        };

      default:
        return { isValid: false, error: 'Unsupported health data type' };
    }
  } catch (error) {
    return { isValid: false, error: 'Error transforming health data' };
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
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
      .eq('provider', 'apple_health')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching Apple Health integration:', error);
      return NextResponse.json({ error: 'Failed to fetch integration status' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: integration || null,
      is_connected: !!integration?.is_enabled,
    });

  } catch (error) {
    console.error('Error in GET Apple Health integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Additional endpoint for getting sync instructions for mobile app
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({
    instructions: {
      connect: {
        method: 'POST',
        url: '/api/integrations/apple-health?action=connect',
        body: {
          device_id: 'string (required)',
          app_version: 'string (optional)',
          permissions: 'array of strings (required)',
        },
      },
      sync: {
        method: 'POST',
        url: '/api/integrations/apple-health?action=sync',
        body: {
          health_data: [
            {
              type: 'steps|calories|heart_rate|weight|sleep|blood_pressure',
              value: 'object (varies by type)',
              start_date: 'ISO datetime string',
              end_date: 'ISO datetime string (optional)',
              source: 'string (optional)',
              metadata: 'object (optional)',
            },
          ],
        },
      },
      examples: {
        steps: { type: 'steps', value: { count: 8500 } },
        calories: { type: 'calories', value: { amount: 2200 } },
        heart_rate: { type: 'heart_rate', value: { bpm: 72 } },
        weight: { type: 'weight', value: { weight: 70.5, unit: 'kg' } },
        sleep: { type: 'sleep', value: { hours: 7.5, quality: 4 } },
        blood_pressure: { type: 'blood_pressure', value: { systolic: 120, diastolic: 80 } },
      },
    },
  });
}
