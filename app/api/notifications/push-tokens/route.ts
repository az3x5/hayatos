import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const registerTokenSchema = z.object({
  device_id: z.string().min(1),
  platform: z.enum(['web', 'android', 'ios']),
  token: z.string().min(1),
});

const updateTokenSchema = z.object({
  token: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
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
    const platform = url.searchParams.get('platform');

    // Get user's push tokens using database function
    const { data: tokens, error } = await supabase
      .rpc('get_user_push_tokens', {
        user_uuid: session.user.id,
        platform_filter: platform
      });

    if (error) {
      console.error('Error fetching push tokens:', error);
      return NextResponse.json({ error: 'Failed to fetch push tokens' }, { status: 500 });
    }

    return NextResponse.json({ data: tokens || [] });

  } catch (error) {
    console.error('Error in GET /api/notifications/push-tokens:', error);
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

    const body = await request.json();
    const validatedData = registerTokenSchema.parse(body);

    // Register push token using database function
    const { data: result, error } = await supabase
      .rpc('register_push_token', {
        user_uuid: session.user.id,
        device_id_param: validatedData.device_id,
        platform_param: validatedData.platform,
        token_param: validatedData.token
      });

    if (error) {
      console.error('Error registering push token:', error);
      return NextResponse.json({ error: 'Failed to register push token' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: result[0],
      message: 'Push token registered successfully' 
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/notifications/push-tokens:', error);
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
    const deviceId = url.searchParams.get('device_id');
    const platform = url.searchParams.get('platform');

    if (!deviceId || !platform) {
      return NextResponse.json({ error: 'Device ID and platform required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateTokenSchema.parse(body);

    // Update push token
    const { data: updatedToken, error } = await supabase
      .from('push_tokens')
      .update({
        ...validatedData,
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', session.user.id)
      .eq('device_id', deviceId)
      .eq('platform', platform)
      .select()
      .single();

    if (error) {
      console.error('Error updating push token:', error);
      return NextResponse.json({ error: 'Failed to update push token' }, { status: 500 });
    }

    if (!updatedToken) {
      return NextResponse.json({ error: 'Push token not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      data: updatedToken,
      message: 'Push token updated successfully' 
    });

  } catch (error) {
    console.error('Error in PUT /api/notifications/push-tokens:', error);
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
    const deviceId = url.searchParams.get('device_id');
    const platform = url.searchParams.get('platform');
    const action = url.searchParams.get('action');

    if (action === 'deactivate_all') {
      // Deactivate all tokens for user
      const { error } = await supabase
        .from('push_tokens')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error deactivating push tokens:', error);
        return NextResponse.json({ error: 'Failed to deactivate push tokens' }, { status: 500 });
      }

      return NextResponse.json({ message: 'All push tokens deactivated successfully' });
    }

    if (!deviceId || !platform) {
      return NextResponse.json({ error: 'Device ID and platform required' }, { status: 400 });
    }

    // Delete specific push token
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', session.user.id)
      .eq('device_id', deviceId)
      .eq('platform', platform);

    if (error) {
      console.error('Error deleting push token:', error);
      return NextResponse.json({ error: 'Failed to delete push token' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Push token deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/notifications/push-tokens:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
