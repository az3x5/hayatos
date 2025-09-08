import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const integrationCreateSchema = z.object({
  integration_type: z.enum([
    'google_calendar', 'google_fit', 'apple_health', 'fitbit', 
    'banking_api', 'spotify', 'github', 'slack', 'notion'
  ]),
  integration_name: z.string().min(1).max(100),
  is_enabled: z.boolean().default(true),
  sync_frequency: z.enum(['realtime', 'hourly', 'daily', 'weekly', 'manual']).default('hourly'),
  settings: z.record(z.any()).default({}),
  permissions: z.record(z.any()).default({}),
});

const integrationUpdateSchema = z.object({
  integration_name: z.string().min(1).max(100).optional(),
  is_enabled: z.boolean().optional(),
  sync_frequency: z.enum(['realtime', 'hourly', 'daily', 'weekly', 'manual']).optional(),
  sync_enabled: z.boolean().optional(),
  settings: z.record(z.any()).optional(),
  permissions: z.record(z.any()).optional(),
});

const oauthCallbackSchema = z.object({
  integration_type: z.string(),
  code: z.string(),
  state: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const integrationType = url.searchParams.get('type');

    if (action === 'available') {
      return handleGetAvailableIntegrations();
    }

    if (action === 'status') {
      return handleGetIntegrationStatus(supabase, session.user.id);
    }

    if (action === 'oauth_url' && integrationType) {
      return handleGetOAuthURL(integrationType, session.user.id);
    }

    // Get user integrations
    let query = supabase
      .from('user_integrations')
      .select(`
        id,
        integration_type,
        integration_name,
        is_enabled,
        sync_frequency,
        sync_enabled,
        last_sync_at,
        sync_status,
        sync_error,
        settings,
        permissions,
        created_at,
        updated_at
      `)
      .eq('user_id', session.user.id);

    if (integrationType) {
      query = query.eq('integration_type', integrationType);
    }

    const { data: integrations, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching integrations:', error);
      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
    }

    return NextResponse.json({ data: integrations || [] });

  } catch (error) {
    console.error('Error in GET /api/settings/integrations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    if (action === 'oauth_callback') {
      return handleOAuthCallback(supabase, request, session.user.id);
    }

    if (action === 'sync') {
      return handleSyncIntegration(supabase, request, session.user.id);
    }

    if (action === 'test') {
      return handleTestIntegration(supabase, request, session.user.id);
    }

    // Create new integration
    const body = await request.json();
    const validatedData = integrationCreateSchema.parse(body);

    // Check if integration already exists
    const { data: existingIntegration } = await supabase
      .from('user_integrations')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('integration_type', validatedData.integration_type)
      .single();

    if (existingIntegration) {
      return NextResponse.json({ error: 'Integration already exists' }, { status: 409 });
    }

    // Create integration
    const { data: newIntegration, error } = await supabase
      .from('user_integrations')
      .insert({
        user_id: session.user.id,
        ...validatedData,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating integration:', error);
      return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: newIntegration,
      message: 'Integration created successfully' 
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/settings/integrations:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const integrationId = url.searchParams.get('id');

    if (!integrationId) {
      return NextResponse.json({ error: 'Integration ID required' }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = integrationUpdateSchema.parse(body);

    // Update integration
    const { data: updatedIntegration, error } = await supabase
      .from('user_integrations')
      .update(validatedData)
      .eq('id', integrationId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating integration:', error);
      return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 });
    }

    if (!updatedIntegration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      data: updatedIntegration,
      message: 'Integration updated successfully' 
    });

  } catch (error) {
    console.error('Error in PUT /api/settings/integrations:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const integrationId = url.searchParams.get('id');

    if (!integrationId) {
      return NextResponse.json({ error: 'Integration ID required' }, { status: 400 });
    }

    // Delete integration
    const { error } = await supabase
      .from('user_integrations')
      .delete()
      .eq('id', integrationId)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error deleting integration:', error);
      return NextResponse.json({ error: 'Failed to delete integration' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Integration deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/settings/integrations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleGetAvailableIntegrations() {
  const availableIntegrations = [
    {
      type: 'google_calendar',
      name: 'Google Calendar',
      description: 'Sync tasks and events with Google Calendar',
      icon: '📅',
      category: 'productivity',
      features: ['Two-way sync', 'Event creation', 'Reminder sync'],
      oauth_required: true,
    },
    {
      type: 'google_fit',
      name: 'Google Fit',
      description: 'Track fitness data and health metrics',
      icon: '🏃',
      category: 'health',
      features: ['Activity tracking', 'Health metrics', 'Goal sync'],
      oauth_required: true,
    },
    {
      type: 'apple_health',
      name: 'Apple Health',
      description: 'Sync health and fitness data from Apple Health',
      icon: '🍎',
      category: 'health',
      features: ['Health data', 'Workout sync', 'Vital signs'],
      oauth_required: false,
    },
    {
      type: 'fitbit',
      name: 'Fitbit',
      description: 'Connect your Fitbit device for activity tracking',
      icon: '⌚',
      category: 'health',
      features: ['Activity tracking', 'Sleep data', 'Heart rate'],
      oauth_required: true,
    },
    {
      type: 'banking_api',
      name: 'Banking API',
      description: 'Connect bank accounts for expense tracking',
      icon: '🏦',
      category: 'finance',
      features: ['Transaction sync', 'Balance tracking', 'Categorization'],
      oauth_required: true,
    },
    {
      type: 'spotify',
      name: 'Spotify',
      description: 'Track music listening habits and mood',
      icon: '🎵',
      category: 'lifestyle',
      features: ['Listening history', 'Mood tracking', 'Playlist sync'],
      oauth_required: true,
    },
    {
      type: 'github',
      name: 'GitHub',
      description: 'Track coding activity and contributions',
      icon: '💻',
      category: 'productivity',
      features: ['Commit tracking', 'Project sync', 'Activity metrics'],
      oauth_required: true,
    },
    {
      type: 'slack',
      name: 'Slack',
      description: 'Sync work communication and status',
      icon: '💬',
      category: 'productivity',
      features: ['Status sync', 'Message tracking', 'Team integration'],
      oauth_required: true,
    },
    {
      type: 'notion',
      name: 'Notion',
      description: 'Sync notes and knowledge base',
      icon: '📝',
      category: 'productivity',
      features: ['Note sync', 'Database integration', 'Content sync'],
      oauth_required: true,
    },
  ];

  return NextResponse.json({ data: availableIntegrations });
}

async function handleGetIntegrationStatus(supabase: any, userId: string) {
  const { data: status, error } = await supabase
    .rpc('get_integration_status', {
      user_uuid: userId
    });

  if (error) {
    console.error('Error fetching integration status:', error);
    return NextResponse.json({ error: 'Failed to fetch integration status' }, { status: 500 });
  }

  return NextResponse.json({ data: status || [] });
}

async function handleGetOAuthURL(integrationType: string, userId: string) {
  // Generate OAuth URLs for different services
  const oauthConfigs = {
    google_calendar: {
      url: `https://accounts.google.com/oauth/authorize?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&scope=https://www.googleapis.com/auth/calendar&response_type=code&state=${userId}`,
      scopes: ['calendar']
    },
    google_fit: {
      url: `https://accounts.google.com/oauth/authorize?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&scope=https://www.googleapis.com/auth/fitness.activity.read&response_type=code&state=${userId}`,
      scopes: ['fitness']
    },
    fitbit: {
      url: `https://www.fitbit.com/oauth2/authorize?client_id=${process.env.FITBIT_CLIENT_ID}&redirect_uri=${process.env.FITBIT_REDIRECT_URI}&scope=activity%20heartrate%20sleep&response_type=code&state=${userId}`,
      scopes: ['activity', 'heartrate', 'sleep']
    },
    spotify: {
      url: `https://accounts.spotify.com/authorize?client_id=${process.env.SPOTIFY_CLIENT_ID}&redirect_uri=${process.env.SPOTIFY_REDIRECT_URI}&scope=user-read-recently-played%20user-top-read&response_type=code&state=${userId}`,
      scopes: ['user-read-recently-played', 'user-top-read']
    },
    github: {
      url: `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_REDIRECT_URI}&scope=user%20repo&state=${userId}`,
      scopes: ['user', 'repo']
    },
  };

  const config = oauthConfigs[integrationType as keyof typeof oauthConfigs];
  
  if (!config) {
    return NextResponse.json({ error: 'OAuth not supported for this integration' }, { status: 400 });
  }

  return NextResponse.json({ 
    data: { 
      oauth_url: config.url,
      scopes: config.scopes,
      integration_type: integrationType
    } 
  });
}

async function handleOAuthCallback(supabase: any, request: NextRequest, userId: string) {
  const body = await request.json();
  const validatedData = oauthCallbackSchema.parse(body);

  // Here you would exchange the authorization code for access tokens
  // This is a simplified example - in production, you'd implement proper OAuth flow

  const { data: integration, error } = await supabase
    .from('user_integrations')
    .update({
      access_token: 'encrypted_access_token', // In production, encrypt this
      refresh_token: 'encrypted_refresh_token',
      token_expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      sync_status: 'success',
      last_sync_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('integration_type', validatedData.integration_type)
    .select()
    .single();

  if (error) {
    console.error('Error updating integration with OAuth tokens:', error);
    return NextResponse.json({ error: 'Failed to complete OAuth flow' }, { status: 500 });
  }

  return NextResponse.json({ 
    data: integration,
    message: 'Integration connected successfully' 
  });
}

async function handleSyncIntegration(supabase: any, request: NextRequest, userId: string) {
  const { integration_type } = await request.json();

  if (!integration_type) {
    return NextResponse.json({ error: 'Integration type required' }, { status: 400 });
  }

  const { data: result, error } = await supabase
    .rpc('sync_integration', {
      user_uuid: userId,
      integration_type_param: integration_type
    });

  if (error) {
    console.error('Error syncing integration:', error);
    return NextResponse.json({ error: 'Failed to sync integration' }, { status: 500 });
  }

  return NextResponse.json({ 
    data: result?.[0] || {},
    message: 'Integration sync initiated' 
  });
}

async function handleTestIntegration(supabase: any, request: NextRequest, userId: string) {
  const { integration_id } = await request.json();

  if (!integration_id) {
    return NextResponse.json({ error: 'Integration ID required' }, { status: 400 });
  }

  // Get integration details
  const { data: integration, error } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('id', integration_id)
    .eq('user_id', userId)
    .single();

  if (error || !integration) {
    return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
  }

  // Simulate testing the integration connection
  const testResult = {
    success: true,
    message: `Successfully connected to ${integration.integration_name}`,
    data: {
      integration_type: integration.integration_type,
      last_test: new Date().toISOString(),
      status: 'connected'
    }
  };

  return NextResponse.json({ 
    data: testResult,
    message: 'Integration test completed' 
  });
}
