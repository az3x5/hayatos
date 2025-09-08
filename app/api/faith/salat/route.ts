import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const logSalatSchema = z.object({
  prayer_name: z.enum(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']),
  prayer_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['completed', 'missed', 'qada']).default('completed'),
  is_congregation: z.boolean().default(false),
  notes: z.string().optional(),
});

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  prayer_name: z.enum(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']).optional(),
  include_stats: z.string().transform(Boolean).default('false'),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const queryParams: Record<string, any> = Object.fromEntries(url.searchParams.entries());

    if (queryParams.include_stats) {
      queryParams.include_stats = queryParams.include_stats === 'true';
    }

    const validatedQuery = querySchema.parse(queryParams);

    // If requesting specific date, get daily status
    if (validatedQuery.date) {
      const { data: dailyStatus, error } = await supabase
        .rpc('get_daily_salat_status', {
          user_uuid: session.user.id,
          target_date: validatedQuery.date,
        });

      if (error) {
        console.error('Error fetching daily salat status:', error);
        return NextResponse.json({ error: 'Failed to fetch daily status' }, { status: 500 });
      }

      return NextResponse.json({ data: dailyStatus || [] });
    }

    // Build query for salat logs
    let query = supabase
      .from('salat_logs')
      .select('*')
      .eq('user_id', session.user.id);

    // Apply filters
    if (validatedQuery.start_date) {
      query = query.gte('prayer_date', validatedQuery.start_date);
    }

    if (validatedQuery.end_date) {
      query = query.lte('prayer_date', validatedQuery.end_date);
    }

    if (validatedQuery.prayer_name) {
      query = query.eq('prayer_name', validatedQuery.prayer_name);
    }

    // Order by date and prayer time
    query = query.order('prayer_date', { ascending: false })
                 .order('prayer_name', { ascending: true });

    const { data: salatLogs, error } = await query;

    if (error) {
      console.error('Error fetching salat logs:', error);
      return NextResponse.json({ error: 'Failed to fetch salat logs' }, { status: 500 });
    }

    let response: any = { data: salatLogs || [] };

    // Include statistics if requested
    if (validatedQuery.include_stats) {
      const { data: streakData } = await supabase
        .rpc('calculate_salat_streak', {
          user_uuid: session.user.id,
        });

      const { data: monthlyStats } = await supabase
        .rpc('get_monthly_salat_stats', {
          user_uuid: session.user.id,
        });

      response.statistics = {
        streak: streakData?.[0] || {
          current_streak: 0,
          longest_streak: 0,
          total_prayers: 0,
          completion_rate: 0,
        },
        monthly: monthlyStats || [],
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in GET /api/faith/salat:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = logSalatSchema.parse(body);

    // Set prayer date if not provided
    const prayerDate = validatedData.prayer_date || new Date().toISOString().split('T')[0];

    // Check if prayer already logged for this date
    const { data: existingLog } = await supabase
      .from('salat_logs')
      .select('id, status')
      .eq('user_id', session.user.id)
      .eq('prayer_name', validatedData.prayer_name)
      .eq('prayer_date', prayerDate)
      .single();

    if (existingLog) {
      // Update existing log
      const { data: updatedLog, error } = await supabase
        .from('salat_logs')
        .update({
          status: validatedData.status,
          is_congregation: validatedData.is_congregation,
          notes: validatedData.notes,
          logged_at: new Date().toISOString(),
        })
        .eq('id', existingLog.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating salat log:', error);
        return NextResponse.json({ error: 'Failed to update prayer log' }, { status: 500 });
      }

      return NextResponse.json({ 
        data: updatedLog,
        message: 'Prayer log updated successfully' 
      });
    } else {
      // Create new log
      const { data: newLog, error } = await supabase
        .from('salat_logs')
        .insert({
          user_id: session.user.id,
          prayer_name: validatedData.prayer_name,
          prayer_date: prayerDate,
          status: validatedData.status,
          is_congregation: validatedData.is_congregation,
          notes: validatedData.notes,
          logged_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating salat log:', error);
        return NextResponse.json({ error: 'Failed to log prayer' }, { status: 500 });
      }

      return NextResponse.json({ 
        data: newLog,
        message: 'Prayer logged successfully' 
      }, { status: 201 });
    }

  } catch (error) {
    console.error('Error in POST /api/faith/salat:', error);
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

    const body = await request.json();
    const { log_id, ...updateData } = body;

    if (!log_id) {
      return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });
    }

    // Validate update data
    const validatedData = logSalatSchema.partial().parse(updateData);

    // Update the log
    const { data: updatedLog, error } = await supabase
      .from('salat_logs')
      .update({
        ...validatedData,
        logged_at: new Date().toISOString(),
      })
      .eq('id', log_id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating salat log:', error);
      return NextResponse.json({ error: 'Failed to update prayer log' }, { status: 500 });
    }

    if (!updatedLog) {
      return NextResponse.json({ error: 'Prayer log not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      data: updatedLog,
      message: 'Prayer log updated successfully' 
    });

  } catch (error) {
    console.error('Error in PUT /api/faith/salat:', error);
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

    const { log_id } = await request.json();

    if (!log_id) {
      return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });
    }

    // Delete the log
    const { error } = await supabase
      .from('salat_logs')
      .delete()
      .eq('id', log_id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error deleting salat log:', error);
      return NextResponse.json({ error: 'Failed to delete prayer log' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Prayer log deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/faith/salat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
